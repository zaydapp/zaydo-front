'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminPlansApi, superAdminModulesApi } from '@/lib/api';
import { SubscriptionPlan, ModuleDefinition } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { PlanForm, PlanFormValues } from '@/components/super-admin/plans/plan-form';
import { toast } from 'sonner';
import { PlusCircle, MoreHorizontal } from 'lucide-react';

export default function SuperAdminPlansPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ['super-admin', 'plans', 'all'],
    queryFn: async () => {
      const response = await superAdminPlansApi.list();
      return response.data;
    },
  });

  const modulesQuery = useQuery({
    queryKey: ['super-admin', 'modules', 'all'],
    queryFn: async () => {
      const response = await superAdminModulesApi.list();
      return response.data;
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: (values: PlanFormValues) =>
      superAdminPlansApi.create({
        ...values,
      }),
    onSuccess: () => {
      toast.success('Plan created');
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'plans'] });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create plan');
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: (payload: { planId: string; values: PlanFormValues }) =>
      superAdminPlansApi.update(payload.planId, {
        ...payload.values,
      }),
    onSuccess: () => {
      toast.success('Plan updated');
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'plans'] });
      setDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update plan');
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => superAdminPlansApi.archive(planId),
    onSuccess: () => {
      toast.success('Plan archived');
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'plans'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to archive plan');
    },
  });

  const plans = plansQuery.data ?? [];
  const modules = modulesQuery.data ?? [];

  const handleCreate = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground">
            Configure pricing, included modules, and seat limits. Use these plans to manage billing and tenant entitlements.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New plan
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description || 'No description provided.'}</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(plan)}>Edit plan</DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => deletePlanMutation.mutate(plan.id)}
                  >
                    Archive plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Monthly price</p>
                  <p className="text-lg font-semibold">${plan.priceMonthly.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Yearly price</p>
                  <p className="text-lg font-semibold">${plan.priceYearly.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max users</p>
                  <p className="text-lg font-semibold">{plan.maxUsers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trial period</p>
                  <p className="text-lg font-semibold">
                    {typeof plan.trialPeriodDays === 'number' ? `${plan.trialPeriodDays} days` : 'No trial'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Included modules</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {plan.includedModuleKeys.length ? (
                    plan.includedModuleKeys.map((moduleKey) => (
                      <Badge key={moduleKey} variant="outline">
                        {moduleKey}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No modules bundled.</p>
                  )}
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                {plan.tenantCount
                  ? `${plan.tenantCount} tenants subscribed (${plan.activeTenantIds.length} active).`
                  : 'No tenants currently on this plan.'}
              </div>
            </CardContent>
          </Card>
        ))}
        {!plans.length && !plansQuery.isLoading && (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            No plans defined yet. Create your first pricing tier to onboard tenants.
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit subscription plan' : 'Create subscription plan'}</DialogTitle>
          </DialogHeader>
          <PlanForm
            modules={modules as ModuleDefinition[]}
            defaultValues={editingPlan ?? undefined}
            onSubmit={async (values) => {
              if (editingPlan) {
                await updatePlanMutation.mutateAsync({ planId: editingPlan.id, values });
              } else {
                await createPlanMutation.mutateAsync(values);
              }
            }}
            onCancel={() => {
              setDialogOpen(false);
              setEditingPlan(null);
            }}
            isSubmitting={createPlanMutation.isPending || updatePlanMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}


