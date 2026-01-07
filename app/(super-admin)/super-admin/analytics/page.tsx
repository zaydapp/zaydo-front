'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminDashboardApi } from '@/lib/api';
import { GrowthChart } from '@/components/super-admin/dashboard/growth-chart';
import { RevenueBreakdown } from '@/components/super-admin/dashboard/revenue-breakdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS: Array<{ label: string; value: '30d' | '90d' | '365d' }> = [
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: '12 months', value: '365d' },
];

export default function SuperAdminAnalyticsPage() {
  const [period, setPeriod] = useState<'30d' | '90d' | '365d'>('90d');

  const overviewQuery = useQuery({
    queryKey: ['super-admin', 'dashboard', 'overview'],
    queryFn: async () => {
      const response = await superAdminDashboardApi.getOverview();
      return response.data;
    },
  });

  const growthQuery = useQuery({
    queryKey: ['super-admin', 'dashboard', 'growth', period],
    queryFn: async () => {
      const response = await superAdminDashboardApi.getGrowthSeries(period);
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics & Trends</h1>
          <p className="text-sm text-muted-foreground">
            Explore revenue, growth, and module adoption trends to make data-driven decisions for your SaaS business.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-background p-1">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                period === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <GrowthChart data={growthQuery.data ?? []} isLoading={growthQuery.isLoading} title="Tenant growth" />
        <RevenueBreakdown data={overviewQuery.data?.revenueByPlan ?? []} isLoading={overviewQuery.isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Insights</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
          <div className="rounded-lg border bg-muted/30 p-4">
            Track plan performance to determine which tiers attract the most tenants and where to iterate on pricing.
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            Use growth periods to forecast infrastructure needs and proactively expand capacity ahead of demand spikes.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


