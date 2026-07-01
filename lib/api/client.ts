import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// ─── Storage helpers ──────────────────────────────────────────────────────────

const redirectToAuth = (isSuperAdmin: boolean) => {
  if (typeof window === 'undefined') return;
  window.location.href = isSuperAdmin ? '/super-admin/login' : '/login';
};

const clearAuthStorage = (isSuperAdmin: boolean) => {
  if (typeof window === 'undefined') return;
  const isImpersonated = sessionStorage.getItem('impersonated') === 'true';
  if (isImpersonated) {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('tenantId');
    sessionStorage.removeItem('impersonated');
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    if (isSuperAdmin) {
      localStorage.removeItem('superAdminAccessToken');
      localStorage.removeItem('superAdminUser');
    }
  }
};

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const sessionToken = sessionStorage.getItem('accessToken');
  if (sessionToken) return sessionToken;
  return localStorage.getItem('accessToken') ?? localStorage.getItem('superAdminAccessToken');
};

const getTenantId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('tenantId') ?? localStorage.getItem('tenantId');
};

// ─── JWT helpers ──────────────────────────────────────────────────────────────

const parseJwtExpiry = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

// Returns true if token has expired or will expire within bufferMs (default 60 s)
const isTokenExpiredOrExpiringSoon = (token: string, bufferMs = 60_000): boolean => {
  const expiry = parseJwtExpiry(token);
  if (!expiry) return true;
  return Date.now() >= expiry - bufferMs;
};

// ─── Refresh logic with concurrency guard ─────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];
let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;

const drainQueue = (error: unknown, token: string | null = null) => {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  refreshQueue = [];
};

const doRefresh = async (): Promise<string> => {
  if (typeof window === 'undefined') throw new Error('No window context');

  const isImpersonated = sessionStorage.getItem('impersonated') === 'true';
  const refreshToken = isImpersonated
    ? sessionStorage.getItem('refreshToken')
    : localStorage.getItem('refreshToken');

  if (!refreshToken) throw new Error('No refresh token available');

  const { data } = await axios.post<{ accessToken: string; refreshToken?: string }>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken }
  );

  // Persist new tokens (handles rotating refresh tokens from the backend)
  if (isImpersonated) {
    sessionStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) sessionStorage.setItem('refreshToken', data.refreshToken);
  } else {
    localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
  }

  // Re-arm the proactive timer for the new token
  scheduleProactiveRefresh(data.accessToken);
  return data.accessToken;
};

// Single in-flight refresh — concurrent callers wait on the same promise
const getValidToken = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => refreshQueue.push({ resolve, reject }));
  }
  isRefreshing = true;
  try {
    const token = await doRefresh();
    drainQueue(null, token);
    return token;
  } catch (err) {
    drainQueue(err);
    throw err;
  } finally {
    isRefreshing = false;
  }
};

/**
 * Schedule a background token refresh 60 s before the access token expires.
 * Call this after login and on page init (when a stored token is found).
 */
export const scheduleProactiveRefresh = (accessToken: string) => {
  if (typeof window === 'undefined') return;
  if (proactiveRefreshTimer) clearTimeout(proactiveRefreshTimer);

  const expiry = parseJwtExpiry(accessToken);
  if (!expiry) return;

  // Refresh 60 s before expiry; fire immediately if already within that window
  const delay = Math.max(expiry - Date.now() - 60_000, 0);
  proactiveRefreshTimer = setTimeout(async () => {
    try {
      await getValidToken();
    } catch {
      // Silent failure — if the refresh token is also expired the 401 interceptor
      // will handle the redirect when the user makes their next API call.
    }
  }, delay);
};

/** Cancel the proactive refresh timer (call on logout). */
export const cancelProactiveRefresh = () => {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }
};

// ─── Axios instance ───────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor — attach token; proactively refresh if expiring within 60 s
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = getToken();

    if (token && isTokenExpiredOrExpiringSoon(token)) {
      try {
        token = await getValidToken();
      } catch {
        // Let the request proceed with the stale token; the 401 interceptor
        // will handle re-authentication if the backend rejects it.
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantId = getTenantId();
    if (tenantId && config.headers) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 with token refresh then retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isSuperAdminRequest = originalRequest?.url?.includes('/super-admin/');

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isSuperAdminRequest) {
        clearAuthStorage(true);
        redirectToAuth(true);
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const accessToken = await getValidToken();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearAuthStorage(false);
        redirectToAuth(false);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
