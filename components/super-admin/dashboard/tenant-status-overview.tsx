'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GlobalKpiStats } from '@/types';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface TenantStatusOverviewProps {
  data?: GlobalKpiStats;
  isLoading?: boolean;
}

interface StatusItem {
  label: string;
  count: number;
  total: number;
  color: string;
  change: number;
}

export function TenantStatusOverview({ data, isLoading }: TenantStatusOverviewProps) {
  const totalTenants = data?.totalTenants || 0;
  
  const statusItems: StatusItem[] = [
    {
      label: 'New Order',
      count: data?.newTenantsThisMonth || 0,
      total: totalTenants,
      color: 'bg-blue-500',
      change: 0.5,
    },
    {
      label: 'On Progress',
      count: data?.activeTenants || 0,
      total: totalTenants,
      color: 'bg-teal-500',
      change: -0.3,
    },
    {
      label: 'Completed',
      count: Math.max(0, totalTenants - (data?.activeTenants || 0) - (data?.churnedTenantsThisMonth || 0)),
      total: totalTenants,
      color: 'bg-emerald-500',
      change: 0.5,
    },
    {
      label: 'Return',
      count: data?.churnedTenantsThisMonth || 0,
      total: totalTenants,
      color: 'bg-orange-500',
      change: -0.5,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Track Order Status</CardTitle>
            <p className="text-sm text-muted-foreground">
              Analyze growth and changes in visitor patterns
            </p>
          </div>
          <button className="text-sm text-muted-foreground hover:text-foreground">
            Export
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 lg:grid-cols-4">
            {statusItems.map((item, index) => {
              const percentage = item.total > 0 ? (item.count / item.total) * 100 : 0;
              return (
                <div key={index} className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <div className="text-3xl font-bold">{item.count}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <div className="flex items-center gap-0.5">
                        {item.change >= 0 ? (
                          <ArrowUp className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-red-600" />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            item.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {Math.abs(item.change)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-1.5" 
                    indicatorClassName={item.color}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
