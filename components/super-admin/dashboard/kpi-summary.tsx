import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlobalKpiStats } from '@/types';
import { cn } from '@/lib/utils';

interface KpiSummaryProps {
  data?: GlobalKpiStats;
  isLoading?: boolean;
}

const KPI_ITEMS: Array<{
  key: keyof GlobalKpiStats;
  label: string;
  formatter?: (value: number) => string;
  highlight?: boolean;
}> = [
  {
    key: 'totalTenants',
    label: 'Total Tenants',
  },
  {
    key: 'activeTenants',
    label: 'Active Tenants',
  },
  {
    key: 'newTenantsThisMonth',
    label: 'New This Month',
    highlight: true,
  },
  {
    key: 'churnedTenantsThisMonth',
    label: 'Churned',
  },
  {
    key: 'monthlyRecurringRevenue',
    label: 'Monthly Recurring Revenue',
    formatter: (value) => `$${value.toLocaleString()}`,
    highlight: true,
  },
  {
    key: 'arr',
    label: 'Annual Recurring Revenue',
    formatter: (value) => `$${value.toLocaleString()}`,
  },
  {
    key: 'totalUsers',
    label: 'Total Users',
  },
  {
    key: 'activeUsers',
    label: 'Active Users',
  },
  {
    key: 'averageRevenuePerUser',
    label: 'ARPU',
    formatter: (value) => `$${value.toFixed(2)}`,
  },
];

export function SuperAdminKpiSummary({ data, isLoading }: KpiSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {KPI_ITEMS.map((item) => {
        const value = data ? data[item.key] ?? 0 : 0;
        return (
          <Card key={item.key} className={cn(item.highlight && 'border-primary/50 shadow-sm')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {isLoading ? (
                <div className="h-7 w-24 animate-pulse rounded bg-muted" />
              ) : (
                (item.formatter?.(Number(value)) ?? Number(value).toLocaleString())
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


