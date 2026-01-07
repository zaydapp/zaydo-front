'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminModulesApi } from '@/lib/api';
import { ModuleDefinition } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SuperAdminModulesPage() {
  const queryClient = useQueryClient();
  const [pendingModuleId, setPendingModuleId] = useState<string | null>(null);

  const modulesQuery = useQuery({
    queryKey: ['super-admin', 'modules', 'all'],
    queryFn: async () => {
      const response = await superAdminModulesApi.list();
      return response.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (payload: { moduleId: string; isGloballyEnabled: boolean }) =>
      superAdminModulesApi.updateGlobalState(payload),
    onMutate: async ({ moduleId, isGloballyEnabled }) => {
      setPendingModuleId(moduleId);
      await queryClient.cancelQueries({ queryKey: ['super-admin', 'modules'] });
      const prev = queryClient.getQueryData<ModuleDefinition[]>(['super-admin', 'modules', 'all']);
      if (prev) {
        queryClient.setQueryData(
          ['super-admin', 'modules', 'all'],
          prev.map((module) =>
            module.id === moduleId ? { ...module, isGloballyEnabled } : module
          )
        );
      }
      return { prev };
    },
    onSuccess: () => {
      toast.success('Module state updated');
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'modules'] });
    },
    onError: (error: any, _variables, context) => {
      toast.error(error?.response?.data?.message || 'Failed to update module');
      if (context?.prev) {
        queryClient.setQueryData(['super-admin', 'modules', 'all'], context.prev);
      }
    },
    onSettled: () => {
      setPendingModuleId(null);
    },
  });

  const modules = modulesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Module Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Manage feature availability across the entire platform. Disabling a module globally removes per-tenant access overrides.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {modules.map((module) => (
          <Card key={module.id}>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{module.name}</CardTitle>
                <CardDescription>{module.description || 'No description provided.'}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={module.isGloballyEnabled}
                  onCheckedChange={(checked) =>
                    toggleMutation.mutate({
                      moduleId: module.id,
                      isGloballyEnabled: Boolean(checked),
                    })
                  }
                  disabled={pendingModuleId === module.id}
                />
                <Badge variant={module.isGloballyEnabled ? 'default' : 'secondary'}>
                  {module.isGloballyEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                Category: <span className="font-medium">{module.category}</span>
              </p>
              <p>
                Active tenants: <span className="font-medium">{module.activeTenantCount}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Changes propagate instantly. Suspended tenants retain their module configuration but lose access until reactivated.
              </p>
            </CardContent>
          </Card>
        ))}
        {!modules.length && !modulesQuery.isLoading && (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            No modules available. Seed module definitions via your backend to manage them here.
          </div>
        )}
      </div>
    </div>
  );
}


