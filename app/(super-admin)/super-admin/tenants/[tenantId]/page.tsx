"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TenantDetailsTabs } from "../components/TenantDetailsTabs";
import { useTenantsStore } from "@/store/tenantsStore";
import {
  superAdminPlansApi,
  superAdminTenantsApi,
  superAdminUsersApi,
  BackendTenantUserSummary,
} from "@/lib/api";
import { TenantCreateInput, TenantUpdateInput, TenantStatus, TenantUserSummary } from "@/types";
import { toast } from "sonner";
import { TenantFormModal } from "../components/TenantFormModal";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
  ) {
    const message = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message;
    if (typeof message === "string") {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export default function TenantDetailsPage() {
  const params = useParams<{ tenantId: string }>();
  const router = useRouter();
  const tenantId = params?.tenantId ?? "";

  const fetchTenantById = useTenantsStore((state) => state.fetchTenantById);
  const selectedTenant = useTenantsStore((state) => state.selectedTenant);
  const isDetailLoading = useTenantsStore((state) => state.isDetailLoading);
  const toggleModule = useTenantsStore((state) => state.toggleModule);
  const fetchTenants = useTenantsStore((state) => state.fetchTenants);
  const modules = useTenantsStore((state) => state.modules);
  const fetchModules = useTenantsStore((state) => state.fetchModules);
  const updateTenant = useTenantsStore((state) => state.updateTenant);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [togglingModuleId, setTogglingModuleId] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actingUserId, setActingUserId] = useState<string | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null);

  const mapUser = (user: BackendTenantUserSummary): TenantUserSummary => {
    const roleMap: Record<string, string> = {
      TENANT_ADMIN: 'Tenant Admin',
      TENANT_USER: 'Member',
    };

    return {
      id: user.id,
      tenantId: user.tenantId,
      tenantName: user.tenant?.name ?? "",
      email: user.email,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      role: roleMap[user.role] ?? user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt ?? undefined,
      createdAt: user.createdAt,
    };
  };

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["super-admin", "tenants", tenantId, "users"],
    queryFn: async () => {
      const response = await superAdminUsersApi.list({
        tenantId,
        page: 1,
        limit: 100,
      });
      return {
        data: (response.data ?? []).map(mapUser),
        pagination: response.pagination,
      };
    },
    enabled: Boolean(tenantId),
  });

  const { data: plansData } = useQuery({
    queryKey: ["super-admin", "plans", "combo"],
    queryFn: async () => {
      const response = await superAdminPlansApi.list();
      return response.data;
    },
  });

  const planOptions = useMemo(() => plansData ?? [], [plansData]);

  useEffect(() => {
    if (tenantId) {
      fetchTenantById(tenantId);
    }
  }, [tenantId, fetchTenantById]);

  useEffect(() => {
    if (!modules.length) {
      fetchModules();
    }
  }, [modules.length, fetchModules]);

  const handleToggleModule = async (moduleId: string, isEnabled: boolean) => {
    if (!tenantId) return;
    setTogglingModuleId(moduleId);
    await toggleModule(tenantId, moduleId, isEnabled);
    setTogglingModuleId(null);
    await refetchUsers();
  };

  const handleStatusChange = async (status: TenantStatus) => {
    if (!tenantId) return;
    setStatusUpdating(true);
    try {
      await superAdminTenantsApi.updateStatus(tenantId, { status });
      await fetchTenantById(tenantId);
      await fetchTenants();
      toast.success(`Tenant ${status === "ACTIVE" ? "activated" : "suspended"}`);
    } catch (error: unknown) {
      console.error("Failed to update tenant status", error);
      toast.error(getErrorMessage(error, "Unable to update tenant status"));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleOpenEdit = () => {
    setModalOpen(true);
  };

  const handleSubmitTenant = async (values: TenantCreateInput | TenantUpdateInput) => {
    if (!tenantId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTenant(tenantId, values as TenantUpdateInput);
      await Promise.all([fetchTenantById(tenantId), fetchTenants()]);
      toast.success("Tenant updated successfully");
      setModalOpen(false);
    } catch (error: unknown) {
      console.error("Failed to update tenant", error);
      toast.error(getErrorMessage(error, "Unable to update tenant"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspendUser = async (user: TenantUserSummary) => {
    if (!user || user.status === 'SUSPENDED') {
      toast.info('User is already suspended.');
      return;
    }

    setActingUserId(user.id);
    try {
      await superAdminUsersApi.suspendUser(user.id, 'Suspended by super admin');
      toast.success(`${user.email} suspended.`);
      await refetchUsers();
    } catch (error: unknown) {
      console.error('Failed to suspend user', error);
      toast.error(getErrorMessage(error, 'Unable to suspend user'));
    } finally {
      setActingUserId(null);
    }
  };

  const handleResetPassword = async (user: TenantUserSummary) => {
    setResettingUserId(user.id);
    try {
      await superAdminUsersApi.resetPassword(user.id);
      toast.success('Password reset instructions sent.');
    } catch (error: unknown) {
      console.error('Failed to reset password', error);
      toast.error(getErrorMessage(error, 'Unable to reset password'));
    } finally {
      setResettingUserId(null);
    }
  };

  const handleImpersonateUser = async (user: TenantUserSummary) => {
    setImpersonatingUserId(user.id);
    try {
      const response = await superAdminUsersApi.impersonate(user.id);
      const targetUrl =
        response.redirectUrl ??
        `${window.location.origin}/impersonate?token=${encodeURIComponent(response.token)}`;
      
      // Open in new tab after successful API call
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      toast.success(`Opening session as ${user.email} in a new tab.`);
    } catch (error: unknown) {
      console.error('Failed to impersonate user', error);
      toast.error(getErrorMessage(error, 'User impersonation feature is not yet implemented'));
    } finally {
      setImpersonatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.push("/super-admin/tenants")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to tenants
          </Button>
          {statusUpdating && <p className="text-sm text-muted-foreground">Updating status…</p>}
        </div>
        {selectedTenant && (
          <Button variant="outline" className="gap-2" onClick={handleOpenEdit}>
            <PencilLine className="h-4 w-4" /> Edit tenant
          </Button>
        )}
      </div>

      {isDetailLoading || !selectedTenant ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading tenant details...
          </CardContent>
        </Card>
      ) : (
        <TenantDetailsTabs
          tenant={selectedTenant}
          users={usersData?.data ?? []}
          usersLoading={usersLoading}
          onToggleModule={handleToggleModule}
          onStatusChange={handleStatusChange}
          onEdit={handleOpenEdit}
          moduleDefinitions={modules}
          onSuspendUser={handleSuspendUser}
          onResetPassword={handleResetPassword}
          actingUserId={actingUserId}
          resettingUserId={resettingUserId}
          onImpersonateUser={handleImpersonateUser}
          impersonatingUserId={impersonatingUserId}
          isStatusUpdating={statusUpdating}
          togglingModuleId={togglingModuleId}
        />
      )}

      {selectedTenant && (
        <TenantFormModal
          open={isModalOpen}
          onOpenChange={setModalOpen}
          onSubmit={handleSubmitTenant}
          modules={modules}
          initialTenant={selectedTenant}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}



