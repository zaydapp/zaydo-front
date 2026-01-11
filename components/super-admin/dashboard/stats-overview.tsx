'use client';

import { Card, CardContent } from '@/components/ui/card';
import { GlobalKpiStats } from '@/types';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsOverviewProps {
  data?: GlobalKpiStats;
  isLoading?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  isLoading?: boolean;
  format?: 'currency' | 'number' | 'percent';
}

function StatCard({ label, value, change, isLoading, format = 'number' }: StatCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percent':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {isLoading ? (
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight">{formatValue(value)}</h3>
              </div>
              {change !== undefined && (
                <div className="flex items-center gap-1">
                  {change >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={cn(
                      'text-xs font-medium',
                      change >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {Math.abs(change).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">Compare from last month</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsOverview({ data, isLoading }: StatsOverviewProps) {
  // Calculate mock changes for demonstration (you can replace with real data from backend)
  const stats = [
    {
      label: 'Total Balance',
      value: data?.monthlyRecurringRevenue || 0,
      format: 'currency' as const,
      change: 3.8,
    },
    {
      label: 'Total Income',
      value: data?.arr || 0,
      format: 'currency' as const,
      change: 2.5,
    },
    {
      label: 'Total Expense',
      value: data?.churnedTenantsThisMonth ? data.churnedTenantsThisMonth * 1000 : 0,
      format: 'currency' as const,
      change: -6.0,
    },
    {
      label: 'Total Sales Tax',
      value: data?.monthlyRecurringRevenue ? Math.round(data.monthlyRecurringRevenue * 0.08) : 0,
      format: 'currency' as const,
      change: 5.0,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          label={stat.label}
          value={stat.value}
          change={stat.change}
          format={stat.format}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
