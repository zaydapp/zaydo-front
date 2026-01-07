'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { SuperAdminUser, ApiResponse } from '@/types';
import {
  superAdminAuthApi,
  SuperAdminLoginPayload,
  SuperAdminLoginResponse,
} from '@/lib/api';

interface SuperAdminAuthContextValue {
  currentUser: SuperAdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: SuperAdminLoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextValue | undefined>(undefined);

const SUPER_ADMIN_ALLOWED_PATHS = ['/super-admin/login', '/super-admin/support'];
const SUPER_ADMIN_STORAGE_KEY = 'superAdminUser';
const SUPER_ADMIN_ACCESS_TOKEN_KEY = 'superAdminAccessToken';
const GLOBAL_ACCESS_TOKEN_KEY = 'accessToken';
const SUPER_ADMIN_REFRESH_TOKEN_KEY = 'refreshToken';

const getStoredUser = (): SuperAdminUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const value = window.localStorage.getItem(SUPER_ADMIN_STORAGE_KEY);
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as SuperAdminUser;
  } catch (error) {
    console.error('Failed to parse stored super admin user', error);
    window.localStorage.removeItem(SUPER_ADMIN_STORAGE_KEY);
    return null;
  }
};

const persistUser = (user: SuperAdminUser | null) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (user) {
    window.localStorage.setItem(SUPER_ADMIN_STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(SUPER_ADMIN_STORAGE_KEY);
  }
};

const persistAccessToken = (token: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(SUPER_ADMIN_ACCESS_TOKEN_KEY, token);
    window.localStorage.setItem(GLOBAL_ACCESS_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(SUPER_ADMIN_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(GLOBAL_ACCESS_TOKEN_KEY);
  }

  window.localStorage.removeItem(SUPER_ADMIN_REFRESH_TOKEN_KEY);
};

const getStoredAccessToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(SUPER_ADMIN_ACCESS_TOKEN_KEY);
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const responseMessage = (error.response?.data as { message?: string } | undefined)?.message;
    return responseMessage ?? fallback;
  }

  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }

  return fallback;
};

export function SuperAdminAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SuperAdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const fetchProfile = useCallback(async () => {
    try {
      const token = getStoredAccessToken();
      const storedUser = getStoredUser();

      if (!token) {
        setCurrentUser(storedUser);
        if (!storedUser && !SUPER_ADMIN_ALLOWED_PATHS.includes(pathname)) {
          router.replace('/super-admin/login');
        }
        return;
      }

      if (storedUser) {
        setCurrentUser(storedUser);
      }

      const response = await superAdminAuthApi.getCurrentUser();
      setCurrentUser(response.data);
      persistUser(response.data);
    } catch {
      setCurrentUser(null);
      persistUser(null);
      persistAccessToken(null);
      if (!SUPER_ADMIN_ALLOWED_PATHS.includes(pathname)) {
        router.replace('/super-admin/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const loginMutation = useMutation({
    mutationFn: async (payload: SuperAdminLoginPayload) => {
      const response = await superAdminAuthApi.login(payload);
      return { response, payload };
    },
    onSuccess: ({ response, payload }: { response: ApiResponse<SuperAdminLoginResponse>; payload: SuperAdminLoginPayload }) => {
      const { user, accessToken } = response.data;
      persistAccessToken(accessToken);
      setCurrentUser(user);
      persistUser(user);
      toast.success(`Welcome back, ${user.firstName ?? user.email}!`);
      if (payload.rememberMe === false) {
        window.addEventListener(
          'beforeunload',
          () => {
            persistUser(null);
            persistAccessToken(null);
          },
          { once: true },
        );
      }
      router.replace('/super-admin/dashboard');
    },
    onError: (error) => {
      const message = extractErrorMessage(
        error,
        'Unable to log in as super admin. Please verify your credentials.',
      );
      toast.error(message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await superAdminAuthApi.logout();
    },
    onSuccess: async () => {
      persistAccessToken(null);
      setCurrentUser(null);
      persistUser(null);
      await queryClient.invalidateQueries();
      toast.info('You have been logged out.');
      router.replace('/super-admin/login');
    },
    onError: (error) => {
      const message = extractErrorMessage(error, 'Logout failed. Please try again.');
      toast.error(message);
    },
  });

  const login = async (payload: SuperAdminLoginPayload) => {
    await loginMutation.mutateAsync(payload);
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      persistAccessToken(null);
      setCurrentUser(null);
      persistUser(null);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <SuperAdminAuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </SuperAdminAuthContext.Provider>
  );
}

export function useSuperAdminAuth() {
  const context = useContext(SuperAdminAuthContext);
  if (!context) {
    throw new Error('useSuperAdminAuth must be used within a SuperAdminAuthProvider');
  }
  return context;
}


