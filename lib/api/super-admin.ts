import apiClient from './client';
import {
  ApiResponse,
  AuditLogEntry,
  ModuleDefinition,
  Notification,
  PaginatedResponse,
  SuperAdminDashboardData,
  SuperAdminSettingsPayload,
  SuperAdminUser,
  TenantModuleAssignment,
  TenantCreateInput,
  TenantUpdateInput,
} from '@/types';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  features: string[];
  maxUsers?: number | null;
  maxStorage?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanWithTenants extends SubscriptionPlan {
  _count?: {
    tenants: number;
  };
}

export interface SuperAdminLoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SuperAdminLoginResponse {
  user: SuperAdminUser;
  accessToken: string;
}

export interface BackendTenantModule {
  moduleId: string;
  isEnabled: boolean;
  enabledAt?: string | null;
  disabledAt?: string | null;
  module?: {
    id: string;
    key: string;
    name: string;
    description?: string | null;
    isGloballyEnabled: boolean;
    category?: string | null;
  };
}

export interface BackendTenantUser {
  id: string;
  email: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  firstName?: string | null;
  lastName?: string | null;
}

export interface BackendTenantUserSummary extends BackendTenantUser {
  tenantId: string;
  role: string;
  tenant?: {
    id: string;
    name: string;
  };
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface BackendTenantSubscription {
  planId: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
  renewalDate?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  monthlyRecurringRevenue?: string | number | null;
  lifetimeValue?: string | number | null;
  plan?: {
    id: string;
    name: string;
    description?: string | null;
  };
}

export interface BackendTenant {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'INACTIVE';
  contactEmail?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  industry?: string | null;
  website?: string | null;
  modules?: BackendTenantModule[];
  subscription?: BackendTenantSubscription | null;
  users?: BackendTenantUser[];
  settings?: Array<{ key: string; value: unknown }>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantStatusPayload {
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'INACTIVE';
  reason?: string;
}

export interface UpdateTenantPlanPayload {
  planId: string;
  trialEndsAt?: string | null;
  note?: string;
}

export interface UpdateTenantModulesPayload {
  modules: Array<Pick<TenantModuleAssignment, 'moduleId' | 'isEnabled'>>;
  note?: string;
}

export type CreatePlanPayload = Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

export interface UpdateModuleGlobalStatePayload {
  moduleId: string;
  isGloballyEnabled: boolean;
}

export type UpdateSystemSettingsPayload = SuperAdminSettingsPayload;

export interface ImpersonationResponse {
  token: string;
  redirectUrl: string;
  expiresAt: string;
  tenantId: string;
  tenantSlug: string;
  email: string;
}

export const superAdminAuthApi = {
  login: async (payload: SuperAdminLoginPayload): Promise<ApiResponse<SuperAdminLoginResponse>> => {
    const { rememberMe: _rememberMe, ...credentials } = payload;
    const response = await apiClient.post<ApiResponse<SuperAdminLoginResponse>>(
      '/super-admin/auth/login',
      credentials
    );
    return response.data;
  },

  logout: async (): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await apiClient.post<ApiResponse<{ success: boolean }>>(
      '/super-admin/auth/logout'
    );
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<SuperAdminUser>> => {
    const response = await apiClient.get<ApiResponse<SuperAdminUser>>('/super-admin/auth/me');
    return response.data;
  },
};

export const superAdminDashboardApi = {
  getOverview: async (): Promise<ApiResponse<SuperAdminDashboardData>> => {
    const response = await apiClient.get<ApiResponse<SuperAdminDashboardData>>(
      '/super-admin/dashboard/overview'
    );
    return response.data;
  },

  getGrowthSeries: async (
    period: '30d' | '90d' | '365d'
  ): Promise<ApiResponse<SuperAdminDashboardData['growthSeries']>> => {
    const response = await apiClient.get<ApiResponse<SuperAdminDashboardData['growthSeries']>>(
      `/super-admin/dashboard/growth?period=${period}`
    );
    return response.data;
  },
};

export const superAdminTenantsApi = {
  list: async (params?: {
    search?: string;
    status?: string;
    planId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<BackendTenant>> => {
    const { page, limit, ...rest } = params ?? {};

    const take = limit ?? undefined;
    const skip =
      typeof page === 'number' && typeof limit === 'number'
        ? (Math.max(page, 1) - 1) * Math.max(limit, 1)
        : undefined;

    const response = await apiClient.get<PaginatedResponse<BackendTenant>>('/super-admin/tenants', {
      params: {
        ...rest,
        take,
        skip,
      },
    });
    return response.data;
  },

  create: async (payload: TenantCreateInput): Promise<BackendTenant> => {
    const response = await apiClient.post<BackendTenant>('/super-admin/tenants', payload);
    return response.data;
  },

  update: async (tenantId: string, payload: TenantUpdateInput): Promise<BackendTenant> => {
    const response = await apiClient.patch<BackendTenant>(
      `/super-admin/tenants/${tenantId}`,
      payload
    );
    return response.data;
  },

  getById: async (tenantId: string): Promise<BackendTenant> => {
    const response = await apiClient.get<BackendTenant>(`/super-admin/tenants/${tenantId}`);
    return response.data;
  },

  updateStatus: async (
    tenantId: string,
    payload: UpdateTenantStatusPayload
  ): Promise<BackendTenant> => {
    const response = await apiClient.patch<BackendTenant>(
      `/super-admin/tenants/${tenantId}/status`,
      payload
    );
    return response.data;
  },

  updatePlan: async (
    tenantId: string,
    payload: UpdateTenantPlanPayload
  ): Promise<BackendTenant> => {
    const response = await apiClient.patch<BackendTenant>(
      `/super-admin/tenants/${tenantId}/plan`,
      payload
    );
    return response.data;
  },

  updateModules: async (
    tenantId: string,
    payload: UpdateTenantModulesPayload
  ): Promise<BackendTenant> => {
    const response = await apiClient.patch<BackendTenant>(
      `/super-admin/tenants/${tenantId}/modules`,
      payload
    );
    return response.data;
  },

  deleteTenant: async (tenantId: string, reason?: string): Promise<{ id: string }> => {
    const response = await apiClient.delete<{ id: string }>(`/super-admin/tenants/${tenantId}`, {
      data: { reason },
    });
    return response.data;
  },
};

export const superAdminPlansApi = {
  list: async (): Promise<ApiResponse<SubscriptionPlanWithTenants[]>> => {
    const response =
      await apiClient.get<ApiResponse<SubscriptionPlanWithTenants[]>>('/super-admin/plans');
    return response.data;
  },

  create: async (payload: CreatePlanPayload): Promise<ApiResponse<SubscriptionPlan>> => {
    const response = await apiClient.post<ApiResponse<SubscriptionPlan>>(
      '/super-admin/plans',
      payload
    );
    return response.data;
  },

  update: async (
    planId: string,
    payload: UpdatePlanPayload
  ): Promise<ApiResponse<SubscriptionPlan>> => {
    const response = await apiClient.put<ApiResponse<SubscriptionPlan>>(
      `/super-admin/plans/${planId}`,
      payload
    );
    return response.data;
  },

  archive: async (planId: string): Promise<ApiResponse<{ id: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ id: string }>>(
      `/super-admin/plans/${planId}`
    );
    return response.data;
  },
};

export const superAdminModulesApi = {
  list: async (): Promise<ModuleDefinition[]> => {
    const response = await apiClient.get<ModuleDefinition[]>('/super-admin/modules');
    return response.data;
  },

  updateGlobalState: async (payload: UpdateModuleGlobalStatePayload): Promise<ModuleDefinition> => {
    const response = await apiClient.patch<ModuleDefinition>(
      '/super-admin/modules/global-state',
      payload
    );
    return response.data;
  },
};

export const superAdminUsersApi = {
  list: async (params?: {
    search?: string;
    tenantId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<BackendTenantUserSummary>> => {
    const { page, limit, ...rest } = params ?? {};

    const take = limit ?? undefined;
    const skip =
      typeof page === 'number' && typeof limit === 'number'
        ? (Math.max(page, 1) - 1) * Math.max(limit, 1)
        : undefined;

    const response = await apiClient.get<PaginatedResponse<BackendTenantUserSummary>>(
      '/super-admin/users',
      {
        params: {
          ...rest,
          take,
          skip,
        },
      }
    );
    return response.data;
  },

  suspendUser: async (userId: string, reason?: string): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>(`/super-admin/users/${userId}/suspend`, {
      reason,
    });
    return response.data;
  },

  resetPassword: async (userId: string): Promise<{ userId: string }> => {
    const response = await apiClient.post<{ userId: string }>(
      `/super-admin/users/${userId}/reset-password`
    );
    return response.data;
  },

  impersonate: async (userId: string): Promise<ImpersonationResponse> => {
    const response = await apiClient.post<ImpersonationResponse>(
      `/super-admin/users/${userId}/impersonate`
    );
    return response.data;
  },
};

export const superAdminAuditLogsApi = {
  list: async (params?: {
    tenantId?: string;
    actorType?: string;
    action?: string;
    resourceType?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AuditLogEntry>> => {
    const response = await apiClient.get<PaginatedResponse<AuditLogEntry>>(
      '/super-admin/audit-logs',
      {
        params,
      }
    );
    return response.data;
  },
};

export const superAdminSettingsApi = {
  get: async (): Promise<ApiResponse<SuperAdminSettingsPayload>> => {
    const response =
      await apiClient.get<ApiResponse<SuperAdminSettingsPayload>>('/super-admin/settings');
    return response.data;
  },

  update: async (
    payload: UpdateSystemSettingsPayload
  ): Promise<ApiResponse<SuperAdminSettingsPayload>> => {
    const response = await apiClient.put<ApiResponse<SuperAdminSettingsPayload>>(
      '/super-admin/settings',
      payload
    );
    return response.data;
  },
};

export const superAdminNotificationsApi = {
  list: async (): Promise<ApiResponse<Notification[]>> => {
    const response = await apiClient.get<ApiResponse<Notification[]>>('/super-admin/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<ApiResponse<{ id: string }>> => {
    const response = await apiClient.post<ApiResponse<{ id: string }>>(
      `/super-admin/notifications/${id}/read`
    );
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await apiClient.post<ApiResponse<{ count: number }>>(
      '/super-admin/notifications/read-all'
    );
    return response.data;
  },
};
