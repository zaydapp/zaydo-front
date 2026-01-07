'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthResponse } from '@/types';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      try {
        // Check sessionStorage first (impersonated sessions), then localStorage (regular sessions)
        const sessionUser = sessionStorage.getItem('user');
        const localUser = localStorage.getItem('user');
        const storedUser = sessionUser || localUser;
        
        console.log('=== AUTH CONTEXT INIT ===');
        console.log('sessionStorage user:', sessionUser ? 'EXISTS' : 'NULL');
        console.log('localStorage user:', localUser ? 'EXISTS' : 'NULL');
        console.log('Using:', sessionUser ? 'sessionStorage' : localUser ? 'localStorage' : 'NONE');
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('Loaded user:', parsedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Failed to restore user:', error);
        // Clear both storages on error
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('tenantId');
        sessionStorage.removeItem('impersonated');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('tenantId');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      // Call the actual backend API
      const response: AuthResponse = await authApi.login(credentials);
      
      // Store tokens and user data
      localStorage.setItem('accessToken', response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.user.tenantId) {
        localStorage.setItem('tenantId', response.user.tenantId);
      }
      
      setUser(response.user);
      
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.response?.data?.message || 'Invalid credentials. Please try again.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Demo mode: Just clear storage without API call
      // await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Check if this is an impersonated session
      const isImpersonated = sessionStorage.getItem('impersonated') === 'true';
      
      // Clear appropriate storage
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
      }
      
      setUser(null);
      
      toast.info('Logged out successfully');
      router.push('/login');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // Update in the appropriate storage
    const isImpersonated = sessionStorage.getItem('impersonated') === 'true';
    if (isImpersonated) {
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
