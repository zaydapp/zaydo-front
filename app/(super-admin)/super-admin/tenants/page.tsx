/*eslint-disable*/
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, RefreshCcw } from 'lucide-react';
import { TenantTable } from './components/TenantTable';
import { TenantFormModal } from './components/TenantFormModal';
import { useTenantsStore } from '@/store/tenantsStore';
import { superAdminPlansApi, superAdminTenantsApi } from '@/lib/api';
import { TenantCreateInput, TenantSummary, TenantUpdateInput } from '@/types';
import { toast } from 'sonner';

export default function SuperAdminTenantsPage() {
  const router = useRouter();
  const tenants = useTenantsStore((state) => state.tenants);
  const isLoading = useTenantsStore((state) => state.isLoading);
  const filters = useTenantsStore((state) => state.filters);
  const setFilters = useTenantsStore((state) => state.setFilters);
  const fetchTenants = useTenantsStore((state) => state.fetchTenants);
  const fetchModules = useTenantsStore((state) => state.fetchModules);
  const modules = useTenantsStore((state) => state.modules);
  const fetchTenantById = useTenantsStore((state) => state.fetchTenantById);
  const createTenant = useTenantsStore((state) => state.createTenant);
  const updateTenant = useTenantsStore((state) => state.updateTenant);
  const selectedTenant = useTenantsStore((state) => state.selectedTenant);
  const setSelectedTenant = useTenantsStore((state) => state.setSelectedTenant);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [statusUpdatingTenantId, setStatusUpdatingTenantId] = useState<string | null>(null);

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['super-admin', 'plans', 'list'],
    queryFn: async () => {
      const response = await superAdminPlansApi.list();
      return response.data;
    },
  });

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants, filtersKey]);

  const handleChangeFilter = (key: 'search' | 'plan' | 'status', value: string) => {
    if (key === 'search') {
      setFilters({ search: value });
    } else if (key === 'plan') {
      setFilters({ plan: value as typeof filters.plan });
    } else {
      setFilters({ status: value as typeof filters.status });
    }
  };

  const handleCreateTenantClick = () => {
    setEditingTenantId(null);
    setSelectedTenant(null);
    setModalOpen(true);
  };

  const handleEditTenant = async (tenant: TenantSummary) => {
    const detail = await fetchTenantById(tenant.id);
    if (detail) {
      setEditingTenantId(detail.id);
      setModalOpen(true);
    }
  };

  const handleViewTenant = (tenant: TenantSummary) => {
    router.push(`/super-admin/tenants/${tenant.id}`);
  };

  const handleToggleStatus = async (tenant: TenantSummary) => {
    if (statusUpdatingTenantId) {
      return;
    }
    setStatusUpdatingTenantId(tenant.id);
    try {
      const nextStatus = tenant.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      await superAdminTenantsApi.updateStatus(tenant.id, { status: nextStatus });
      await fetchTenants();
      toast.success(`Tenant ${nextStatus === 'ACTIVE' ? 'activated' : 'suspended'}`);
    } catch (error: any) {
      console.error('Failed to update tenant status', error);
      toast.error(error?.response?.data?.message || 'Unable to update tenant status');
    } finally {
      setStatusUpdatingTenantId(null);
    }
  };

  const handleSubmitTenant = async (
    values: TenantCreateInput | TenantUpdateInput,
    tenantId?: string
  ) => {
    setIsSubmitting(true);
    try {
      if (tenantId) {
        await updateTenant(tenantId, values);
      } else {
        await createTenant(values as TenantCreateInput);
      }
      setModalOpen(false);
      setEditingTenantId(null);
      setSelectedTenant(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusFilterValue = filters.status ?? 'all';
  const planFilterValue = filters.plan ?? 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tenant Directory</h1>
          <p className="text-sm text-muted-foreground">
            Govern every tenant from a single hub. Suspend access, manage plans, and control module
            availability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchTenants()}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={handleCreateTenantClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> New tenant
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Input
            placeholder="Search by name or domain"
            value={filters.search}
            onChange={(event) => handleChangeFilter('search', event.target.value)}
          />
          <Select
            value={planFilterValue}
            onValueChange={(value) => handleChangeFilter('plan', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              {(plansData ?? []).map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilterValue}
            onValueChange={(value) => handleChangeFilter('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="TRIAL">Trial</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <TenantTable
        tenants={tenants}
        isLoading={isLoading}
        onView={handleViewTenant}
        onEdit={handleEditTenant}
        onDeactivate={handleToggleStatus}
      />

      <TenantFormModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setSelectedTenant(null);
          }
        }}
        onSubmit={handleSubmitTenant}
        modules={modules}
        initialTenant={editingTenantId ? selectedTenant : null}
        isSubmitting={isSubmitting}
      />

      {statusUpdatingTenantId && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm shadow-lg">
            <RefreshCcw className="h-4 w-4 animate-spin" />
            Updating tenant status...
          </div>
        </div>
      )}
    </div>
  );
}
