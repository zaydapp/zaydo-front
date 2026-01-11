'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface TenantActivity {
  id: string;
  tenantName: string;
  action: string;
  type: 'login' | 'module_change' | 'plan_change' | 'user_added';
  timestamp: string;
  details?: string;
}

interface TenantActivityTableProps {
  data?: TenantActivity[];
  isLoading?: boolean;
}

// Mock data for demonstration
const mockActivities: TenantActivity[] = [
  {
    id: '1',
    tenantName: 'Amel Agroalimentaire',
    action: 'Admin logged in',
    type: 'login',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    details: 'admin@amelagro.com',
  },
  {
    id: '2',
    tenantName: 'TechCorp Solutions',
    action: 'Enabled Production Module',
    type: 'module_change',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    details: 'Production / Atelier',
  },
  {
    id: '3',
    tenantName: 'GreenLeaf Industries',
    action: 'Upgraded to Premium Plan',
    type: 'plan_change',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    details: 'Basic → Premium',
  },
  {
    id: '4',
    tenantName: 'Sunrise Manufacturing',
    action: 'Added new user',
    type: 'user_added',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    details: 'john.doe@sunrise.com',
  },
  {
    id: '5',
    tenantName: 'Oceanic Logistics',
    action: 'Admin logged in',
    type: 'login',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    details: 'admin@oceanic.com',
  },
];

export function TenantActivityTable({
  data = mockActivities,
  isLoading,
}: TenantActivityTableProps) {
  const getActivityBadge = (type: TenantActivity['type']) => {
    const variants: Record<TenantActivity['type'], { label: string; className: string }> = {
      login: {
        label: 'Login',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      },
      module_change: {
        label: 'Module',
        className: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      },
      plan_change: {
        label: 'Plan',
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
      },
      user_added: {
        label: 'User',
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
      },
    };

    const variant = variants[type];
    return (
      <Badge variant="secondary" className={`${variant.className} rounded-full font-medium`}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Tenant Activity</CardTitle>
        <p className="text-sm text-muted-foreground">Latest logins and system changes</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((activity) => {
              const initials = activity.tenantName
                .split(' ')
                .map((word) => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <Avatar className="h-10 w-10 bg-primary/10">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{activity.tenantName}</p>
                      {getActivityBadge(activity.type)}
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                    {activity.details && (
                      <p className="text-xs text-muted-foreground">{activity.details}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
