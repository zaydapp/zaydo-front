import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  superAdminModulesApi,
  superAdminTenantsApi,
  UpdateTenantModulesPayload,
  BackendTenant,
  BackendTenantModule,
} from '@/lib/api';
import {
  ModuleDefinition,
  TenantCreateInput,
  TenantDetails,
  TenantModuleAssignment,
  TenantSummary,
  TenantUpdateInput,
} from '@/types';
import { toast } from 'sonner';

const normalizeDecimal = (value: unknown) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

type BackendTenantUser = NonNullable<BackendTenant['users']>[number];

type BackendTenantModuleEntry = BackendTenantModule;

const mapTenantModuleAssignment = (
  assignment: BackendTenantModuleEntry,
): TenantModuleAssignment => ({
  moduleId: assignment.moduleId,
  moduleKey: assignment.module?.key ?? assignment.moduleId,
  moduleName: assignment.module?.name ?? assignment.moduleId,
  isEnabled: Boolean(assignment.isEnabled),
  enabledAt: assignment.enabledAt ? new Date(assignment.enabledAt).toISOString() : undefined,
  disabledAt: assignment.disabledAt ? new Date(assignment.disabledAt).toISOString() : undefined,
});

const mapTenantSummary = (tenant: BackendTenant): TenantSummary => {
  const modules = Array.isArray(tenant.modules) ? tenant.modules : [];
  const activeModuleKeys = modules
    .filter((module) => module.isEnabled)
    .map((module) => module.module?.key)
    .filter((key): key is string => Boolean(key));

  return {
    id: tenant.id,
    companyName: tenant.name,
    slug: tenant.slug,
    contact: {
      name: tenant.contactName ?? '',
      email: tenant.contactEmail ?? '',
      phone: tenant.contactPhone ?? '',
    },
    status: tenant.status,
    currentPlanId: tenant.subscription?.planId ?? '',
    currentPlanName: tenant.subscription?.plan?.name ?? '—',
    activeModuleKeys,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
  };
};

const mapTenantDetails = (tenant: BackendTenant): TenantDetails => {
  const summary = mapTenantSummary(tenant);
  const modules = Array.isArray(tenant.modules) ? tenant.modules.map(mapTenantModuleAssignment) : [];
  const users: BackendTenantUser[] = Array.isArray(tenant.users) ? tenant.users : [];

  return {
    ...summary,
    address: tenant.address ?? '',
    industry: tenant.industry ?? '',
    website: tenant.website ?? '',
    settings: tenant.settings ?? [],
    billing: {
      planId: tenant.subscription?.planId ?? '',
      planName: tenant.subscription?.plan?.name ?? '—',
      status: tenant.subscription?.status ?? 'TRIALING',
      renewalDate: tenant.subscription?.renewalDate ?? undefined,
      stripeCustomerId: tenant.subscription?.stripeCustomerId ?? undefined,
      stripeSubscriptionId: tenant.subscription?.stripeSubscriptionId ?? undefined,
      monthlyRecurringRevenue: normalizeDecimal(tenant.subscription?.monthlyRecurringRevenue),
      lifetimeValue: normalizeDecimal(tenant.subscription?.lifetimeValue),
    },
    modules,
    userCount: users.length,
    activeUserCount: users.filter((user) => user.status === 'ACTIVE').length,
    usage: {
      storageUsedGb: 0,
      apiCallsThisMonth: 0,
      lastActiveAt: undefined,
    },
    auditLogCount: 0,
  };
};

type TenantStatusFilter = 'all' | 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'INACTIVE';
type TenantPlanFilter = 'all' | string;

export interface TenantFiltersState {
  search: string;
  plan: TenantPlanFilter;
  status: TenantStatusFilter;
}

interface TenantsState {
  tenants: TenantSummary[];
  modules: ModuleDefinition[];
  selectedTenant: TenantDetails | null;
  isLoading: boolean;
  isDetailLoading: boolean;
  filters: TenantFiltersState;
  fetchTenants: () => Promise<void>;
  fetchModules: () => Promise<void>;
  fetchTenantById: (tenantId: string) => Promise<TenantDetails | null>;
  createTenant: (payload: TenantCreateInput) => Promise<TenantDetails | null>;
  updateTenant: (tenantId: string, payload: TenantUpdateInput) => Promise<TenantDetails | null>;
  toggleModule: (tenantId: string, moduleId: string, isEnabled: boolean) => Promise<void>;
  setFilters: (filters: Partial<TenantFiltersState>) => void;
  setSelectedTenant: (tenant: TenantDetails | null) => void;
  refreshTenantInList: (tenant: TenantSummary) => void;
}

export const useTenantsStore = create<TenantsState>()(
  devtools((set, get) => ({
    tenants: [],
    modules: [],
    selectedTenant: null,
    isLoading: false,
    isDetailLoading: false,
    filters: {
      search: '',
      plan: 'all',
      status: 'all',
    },
    setFilters: (partial) =>
      set((state) => ({
        filters: {
          ...state.filters,
          ...partial,
        },
      })),
    setSelectedTenant: (tenant) => set({ selectedTenant: tenant }),
    refreshTenantInList: (updatedTenant) =>
      set((state) => ({
        tenants: state.tenants.map((tenant) =>
          tenant.id === updatedTenant.id ? { ...tenant, ...updatedTenant } : tenant
        ),
      })),
    fetchTenants: async () => {
      const { filters } = get();
      set({ isLoading: true });
      try {
        const response = await superAdminTenantsApi.list({
          search: filters.search || undefined,
          planId: filters.plan !== 'all' ? filters.plan : undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          page: 1,
          limit: 100,
        });
        const tenants = (response?.data ?? []).map(mapTenantSummary);
        set({ tenants, isLoading: false });
      } catch (error) {
        console.error('Failed to fetch tenants', error);
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Unable to load tenants');
        set({ isLoading: false });
      }
    },
    fetchModules: async () => {
      try {
        const modules = await superAdminModulesApi.list();
        const sortedModules = [...modules].sort((a, b) => {
          const coreWeight = Number(b.isGloballyEnabled) - Number(a.isGloballyEnabled);
          if (coreWeight !== 0) {
            return coreWeight;
          }
          return a.name.localeCompare(b.name);
        });
        set({ modules: sortedModules });
      } catch (error) {
        console.error('Failed to fetch modules', error);
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Unable to load modules');
      }
    },
    fetchTenantById: async (tenantId: string) => {
      set({ isDetailLoading: true });
      try {
        const response = await superAdminTenantsApi.getById(tenantId);
        const tenant = mapTenantDetails(response);
        set({ selectedTenant: tenant, isDetailLoading: false });
        return tenant;
      } catch (error) {
        console.error('Failed to fetch tenant', error);
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Unable to load tenant details');
        set({ isDetailLoading: false });
        return null;
      }
    },
    createTenant: async (payload: TenantCreateInput) => {
      try {
        const response = await superAdminTenantsApi.create(payload);
        toast.success('Tenant created successfully');
        await get().fetchTenants();
        return mapTenantDetails(response);
      } catch (error) {
        console.error('Failed to create tenant', error);
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Unable to create tenant');
        return null;
      }
    },
    updateTenant: async (tenantId: string, payload: TenantUpdateInput) => {
      try {
        const response = await superAdminTenantsApi.update(tenantId, payload);
        const tenant = mapTenantDetails(response);
        toast.success('Tenant updated successfully');
        await get().fetchTenants();
        set({ selectedTenant: tenant });
        return tenant;
      } catch (error) {
        console.error('Failed to update tenant', error);
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Unable to update tenant');
        return null;
      }
    },
    toggleModule: async (tenantId: string, moduleId: string, isEnabled: boolean) => {
      const currentTenant = get().selectedTenant;
      if (!currentTenant) return;

      const updatedAssignments = currentTenant.modules.map((assignment) =>
        assignment.moduleId === moduleId ? { ...assignment, isEnabled } : assignment
      );

      // Optimistic update
      set({
        selectedTenant: {
          ...currentTenant,
          modules: updatedAssignments,
          activeModuleKeys: updatedAssignments
            .filter((assignment) => assignment.isEnabled)
            .map((assignment) => assignment.moduleKey),
        },
      });

      try {
        const payload: UpdateTenantModulesPayload = {
          modules: updatedAssignments.map((assignment) => ({
            moduleId: assignment.moduleId,
            isEnabled: assignment.isEnabled,
          })),
        };
        await superAdminTenantsApi.updateModules(tenantId, payload);
        await get().fetchTenants();
      } catch (error) {
        console.error('Failed to toggle module', error);
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Unable to update module');
        // rollback
        set({ selectedTenant: currentTenant });
      }
    },
  }))
);

