import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueByPlanDatum } from '@/types';

interface RevenueBreakdownProps {
  data: RevenueByPlanDatum[];
  title?: string;
  isLoading?: boolean;
}

export function RevenueBreakdown({ data, title = 'Revenue by Plan', isLoading }: RevenueBreakdownProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="planName" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
                labelClassName="text-sm font-medium"
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderRadius: '0.75rem',
                  borderColor: 'hsl(var(--border))',
                }}
              />
              <Bar dataKey="mrr" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}


