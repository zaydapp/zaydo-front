'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant } from '@/types';
import { tenantApi } from '@/lib/api';
import { useAuth } from './auth-context';

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  refreshTenant: () => Promise<void>;
  updateTenant: (tenant: Tenant) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  const fetchTenant = async () => {
    try {
      console.log('=== FETCHING TENANT ===');
      const tenantData = await tenantApi.getCurrent();
      console.log('Tenant data received:', tenantData);
      console.log('Enabled modules:', tenantData.enabledModules);
      setTenant(tenantData);
    } catch (error) {
      console.error('Failed to fetch tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== TENANT CONTEXT EFFECT ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);

    if (isAuthenticated && user) {
      console.log('Fetching tenant data...');
      fetchTenant();
    } else {
      console.log('Not authenticated or no user, clearing tenant');
      setTenant(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const refreshTenant = async () => {
    setIsLoading(true);
    await fetchTenant();
  };

  const updateTenant = (updatedTenant: Tenant) => {
    setTenant(updatedTenant);
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        isLoading,
        refreshTenant,
        updateTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
