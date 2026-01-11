import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

const redirectToAuth = (isSuperAdmin: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.location.href = isSuperAdmin ? '/super-admin/login' : '/login';
};

const clearAuthStorage = (isSuperAdmin: boolean) => {
  if (typeof window === 'undefined') return;
  // Check if this is an impersonated session (stored in sessionStorage)
  const isImpersonated = sessionStorage.getItem('impersonated') === 'true';
  
  if (isImpersonated) {
    // Clear only sessionStorage for impersonated sessions
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('tenantId');
    sessionStorage.removeItem('impersonated');
  } else {
    // Clear localStorage for regular sessions
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

// Helper function to get token from either sessionStorage or localStorage
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  // Check sessionStorage first (impersonated sessions)
  const sessionToken = sessionStorage.getItem('accessToken');
  if (sessionToken) return sessionToken;
  
  // Fall back to localStorage (regular sessions)
  return localStorage.getItem('accessToken') ?? localStorage.getItem('superAdminAccessToken');
};

// Helper function to get tenant ID from either sessionStorage or localStorage
const getTenantId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('tenantId') ?? localStorage.getItem('tenantId');
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantId = getTenantId();
    if (tenantId && config.headers) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isSuperAdminRequest = originalRequest?.url?.includes('/super-admin/');

    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isSuperAdminRequest) {
        clearAuthStorage(true);
        redirectToAuth(true);
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        if (typeof window === 'undefined') {
          return Promise.reject(error);
        }
        
        const isImpersonated = sessionStorage.getItem('impersonated') === 'true';
        const refreshToken = isImpersonated
          ? sessionStorage.getItem('refreshToken')
          : localStorage.getItem('refreshToken');

        if (!refreshToken) {
          clearAuthStorage(false);
          redirectToAuth(false);
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;

        // Store in the appropriate storage
        if (isImpersonated) {
          sessionStorage.setItem('accessToken', accessToken);
        } else {
          localStorage.setItem('accessToken', accessToken);
        }

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
