'use client';

import { useQuery } from '@tanstack/react-query';
import { superAdminDashboardApi } from '@/lib/api';
import { StatsOverview } from '@/components/super-admin/dashboard/stats-overview';
import { RevenueChart } from '@/components/super-admin/dashboard/revenue-chart';
import { BestPerformingPlans } from '@/components/super-admin/dashboard/best-performing-plans';
import { TenantActivityTable } from '@/components/super-admin/dashboard/tenant-activity-table';
import { PlanDistributionChart } from '@/components/super-admin/dashboard/plan-distribution-chart';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Building2, Puzzle, TrendingUp } from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const {
    data: overview,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['super-admin', 'dashboard', 'overview'],
    queryFn: async () => {
      const response = await superAdminDashboardApi.getOverview();
      return response.data;
    },
  });

  // Calculate top metrics
  const topMetrics = [
    {
      label: 'Total Tenants',
      value: overview?.kpis?.totalTenants || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      label: 'Active Tenants',
      value: overview?.kpis?.activeTenants || 0,
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-950',
    },
    {
      label: 'Total Income',
      value: `$${(overview?.kpis?.monthlyRecurringRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
    },
    {
      label: 'Active Modules',
      value: overview?.moduleUsage?.length || 0,
      icon: Puzzle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-950',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor global performance and manage your SaaS platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/super-admin/plans">
              <Settings className="mr-2 h-4 w-4" />
              Manage Plans
            </Link>
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
            <Link href="/super-admin/tenants/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Link>
          </Button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {topMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    {isLoading ? (
                      <div className="h-8 w-24 animate-pulse rounded bg-muted" />
                    ) : (
                      <p className="text-2xl font-bold">{metric.value}</p>
                    )}
                  </div>
                  <div className={`rounded-full p-3 ${metric.bgColor}`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={overview?.growthSeries ?? []} isLoading={isLoading || isRefetching} />

      {/* Middle Row: Best Plans and Plan Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BestPerformingPlans
          data={overview?.revenueByPlan ?? []}
          isLoading={isLoading || isRefetching}
        />
        <PlanDistributionChart
          data={overview?.revenueByPlan ?? []}
          isLoading={isLoading || isRefetching}
        />
      </div>

      {/* Tenant Activity Table */}
      <TenantActivityTable isLoading={isLoading || isRefetching} />
    </div>
  );
}
