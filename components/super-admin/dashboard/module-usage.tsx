import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModuleUsageDatum } from '@/types';
import { Progress } from '@/components/ui/progress';

interface ModuleUsageProps {
  data: ModuleUsageDatum[];
  isLoading?: boolean;
}

export function ModuleUsageList({ data, isLoading }: ModuleUsageProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Module Utilization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item) => {
              const percentage = item.totalTenantCount
                ? Math.round((item.activeTenantCount / item.totalTenantCount) * 100)
                : 0;
              return (
                <div key={item.moduleKey}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{item.moduleName}</p>
                    <span className="text-xs text-muted-foreground">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="mt-2 h-2" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.activeTenantCount} / {item.totalTenantCount} tenants active
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
