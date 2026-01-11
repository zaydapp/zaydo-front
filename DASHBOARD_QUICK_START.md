# Quick Start Guide - Super Admin Dashboard

## Running the Dashboard

1. **Start the development server**:

   ```powershell
   cd "d:\Next.js Projects\zaydo"
   npm run dev
   ```

2. **Access the dashboard**:
   ```
   http://localhost:3000/super-admin/dashboard
   ```

## Component Usage

### Import Components

```typescript
import {
  StatsOverview,
  RevenueChart,
  BestPerformingPlans,
  TenantStatusOverview,
  RecentTenantActivity,
} from '@/components/super-admin/dashboard';
```

### Basic Implementation

```typescript
export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  });

  return (
    <div className="space-y-6">
      <StatsOverview data={data?.kpis} isLoading={isLoading} />
      <RevenueChart data={data?.timeSeries} isLoading={isLoading} />
      {/* Add more components as needed */}
    </div>
  );
}
```

## Customization

### Change Stat Cards

Edit `components/super-admin/dashboard/stats-overview.tsx`:

```typescript
const stats = [
  {
    label: 'Your Custom Label',
    value: yourDataValue,
    format: 'currency' as const, // 'currency' | 'number' | 'percent'
    change: 5.2, // Percentage change
  },
  // Add more stats...
];
```

### Customize Chart Colors

Edit `app/globals.css`:

```css
:root {
  --chart-1: #1dde9d; /* Primary color */
  --chart-2: #2cb6ff; /* Secondary color */
  /* Add more chart colors */
}
```

### Modify Table Columns

Edit `components/super-admin/dashboard/recent-tenant-activity.tsx`:

```typescript
// Modify the table structure
<th>Your Column Name</th>
// ...
<td>{item.yourDataField}</td>
```

## Styling Tips

### Card Styling

```typescript
<Card className="border-primary/50 shadow-sm">
  {/* Highlighted card */}
</Card>
```

### Button Variants

```typescript
<Button variant="outline">Secondary</Button>
<Button variant="default">Primary</Button>
<Button className="bg-emerald-600">Custom Color</Button>
```

### Responsive Grids

```typescript
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* Auto-responsive grid */}
</div>
```

## Common Patterns

### Loading States

```typescript
{isLoading ? (
  <div className="h-8 w-32 animate-pulse rounded bg-muted" />
) : (
  <div>{data}</div>
)}
```

### Empty States

```typescript
{data.length === 0 ? (
  <p className="text-sm text-muted-foreground">No data available</p>
) : (
  <div>{/* Render data */}</div>
)}
```

### Error Handling

```typescript
{error ? (
  <p className="text-sm text-destructive">Error loading data</p>
) : (
  <div>{/* Normal content */}</div>
)}
```

## TypeScript Types

All types are available from `@/types/super-admin`:

```typescript
import type {
  GlobalKpiStats,
  TimeSeriesPoint,
  RevenueByPlanDatum,
  TenantActivityItem,
} from '@/types/super-admin';
```

## Testing

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import { StatsOverview } from './stats-overview';

test('renders stats cards', () => {
  render(<StatsOverview data={mockData} />);
  expect(screen.getByText('Total Balance')).toBeInTheDocument();
});
```

## Troubleshooting

### Chart Not Rendering

- Ensure Recharts is installed: `npm list recharts`
- Check data format matches `TimeSeriesPoint[]`
- Verify container has height

### Styles Not Applying

- Run build: `npm run build`
- Clear cache: Delete `.next` folder
- Check Tailwind config

### TypeScript Errors

- Update types in `types/super-admin.ts`
- Run type check: `npx tsc --noEmit`

## Performance Tips

1. **Memoize expensive calculations**:

   ```typescript
   const sortedData = useMemo(() => data.sort((a, b) => b.value - a.value), [data]);
   ```

2. **Lazy load heavy components**:

   ```typescript
   const RevenueChart = dynamic(() => import('./revenue-chart').then((m) => m.RevenueChart), {
     ssr: false,
   });
   ```

3. **Optimize images**:
   ```typescript
   import Image from 'next/image';
   <Image src={src} width={40} height={40} alt="..." />
   ```

## Resources

- [Shadcn UI Documentation](https://ui.shadcn.com)
- [Recharts Documentation](https://recharts.org)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

For issues or questions:

1. Check `DASHBOARD_REFACTOR.md` for detailed component docs
2. Review `DASHBOARD_COMPONENT_MAPPING.md` for design reference
3. Consult the TypeScript types in `types/super-admin.ts`

---

**Happy Coding! 🚀**
