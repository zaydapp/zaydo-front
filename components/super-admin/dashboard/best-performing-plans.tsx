'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueByPlanDatum } from '@/types';
import { ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface BestPerformingPlansProps {
  data: RevenueByPlanDatum[];
  isLoading?: boolean;
}

export function BestPerformingPlans({ data, isLoading }: BestPerformingPlansProps) {
  // Sort by MRR and take top 5
  const topPlans = [...data].sort((a, b) => b.mrr - a.mrr).slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Best Selling Product</CardTitle>
          <p className="text-sm text-muted-foreground">Top Selling Products at a Glance</p>
        </div>
        <button className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {topPlans.map((plan, index) => {
              const colors = [
                'bg-teal-500',
                'bg-slate-700 dark:bg-slate-300',
                'bg-blue-500',
                'bg-red-500',
                'bg-orange-500',
              ];
              const initials = plan.planName
                .split(' ')
                .map((word) => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div key={plan.planId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className={`h-12 w-12 ${colors[index % colors.length]}`}>
                      <AvatarFallback className="text-white font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{plan.planName}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {plan.tenantCount} {plan.tenantCount === 1 ? 'tenant' : 'tenants'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">${plan.mrr.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
