'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeSeriesPoint } from '@/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface RevenueChartProps {
  data: TimeSeriesPoint[];
  isLoading?: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  // Transform data for desktop/mobile split
  const chartData = data.map((item) => ({
    date: item.date,
    Desktop: item.value || 0,
    Mobile: item.secondaryValue || Math.round((item.value || 0) * 0.97), // Mock mobile data
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Revenue Chart</CardTitle>
          <p className="text-sm text-muted-foreground">Last 28 days</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[hsl(var(--chart-1))]" />
            <span className="text-muted-foreground">Desktop</span>
            <span className="font-semibold">
              {chartData.reduce((sum, item) => sum + item.Desktop, 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[hsl(var(--chart-2))]" />
            <span className="text-muted-foreground">Mobile</span>
            <span className="font-semibold">
              {chartData.reduce((sum, item) => sum + item.Mobile, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => {
                  // Format date to show month/day
                  const date = new Date(value);
                  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {payload[0].payload.date}
                      </p>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="font-medium">{entry.name}:</span>
                          <span className="font-semibold">{entry.value?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="Desktop"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="Mobile"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
