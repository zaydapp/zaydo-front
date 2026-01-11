# Super Admin Dashboard - Component Mapping

## Reference Design: Shadcn UI Kit Sales Dashboard

Source: https://shadcnuikit.com/dashboard/sales

## Component Mapping

### 1. Header Section

**Reference**: "Sales Dashboard" title with date range and Download button
**Implementation**:

- Title: "Sales Dashboard"
- Date button: CalendarDays icon + "17 Oct 2025 - 13 Nov 2025"
- Action button: Download button with emerald background

### 2. Stats Cards (Top Row)

**Reference**: 4 cards showing Total Balance, Total Income, Total Expense, Total Sales Tax
**Implementation**: `StatsOverview` component

- Card 1: Total Balance (Monthly Recurring Revenue)
- Card 2: Total Income (Annual Recurring Revenue)
- Card 3: Total Expense (Churned tenants × 1000)
- Card 4: Total Sales Tax (8% of MRR)
- Each card includes: metric value, percentage change, comparison text

### 3. Revenue Chart Section

**Reference**: Bar chart showing Desktop/Mobile revenue over 28 days
**Implementation**: `RevenueChart` component

- Dual-bar chart (Desktop/Mobile split)
- X-axis: Date labels (Apr 5, Apr 10, etc.)
- Y-axis: Revenue values
- Legend showing Desktop (teal) and Mobile (blue) totals
- Tooltip on hover

### 4. Best Selling Product

**Reference**: List of top 5 products with images and sales count
**Implementation**: `BestPerformingPlans` component

- Shows top 5 subscription plans by MRR
- Avatar with plan initials (colored background)
- Plan name and tenant count
- Revenue amount aligned right

### 5. Track Order Status

**Reference**: 4 status cards with counts and progress bars
**Implementation**: `TenantStatusOverview` component

- New Order (43 → New tenants this month)
- On Progress (12 → Active tenants)
- Completed (40 → Total - Active - Churned)
- Return (2 → Churned tenants)
- Each includes: large number, label, percentage change, progress bar

### 6. Data Table

**Reference**: Orders table with filter and column controls
**Implementation**: `RecentTenantActivity` component

- Columns: ID, Customer Name, Qty Items, Amount, Payment Method, Status
- Filter input box
- Columns dropdown for visibility control
- Status badges (color-coded)
- Hover effects on rows

## Color Scheme

### Status Colors

- **New Order** / **Blue**: `bg-blue-100 text-blue-700` (light) / `bg-blue-950 text-blue-300` (dark)
- **In Progress** / **Orange**: `bg-orange-100 text-orange-700` (light) / `bg-orange-950 text-orange-300` (dark)
- **Completed** / **Green**: `bg-emerald-100 text-emerald-700` (light) / `bg-emerald-950 text-emerald-300` (dark)
- **On Hold** / **Yellow**: `bg-yellow-100 text-yellow-700` (light) / `bg-yellow-950 text-yellow-300` (dark)

### Chart Colors

- **Chart 1 (Primary)**: `hsl(var(--chart-1))` - Teal (#1dde9d)
- **Chart 2 (Secondary)**: `hsl(var(--chart-2))` - Blue (#2cb6ff)

### Progress Bar Colors

- **New Order**: `bg-blue-500`
- **On Progress**: `bg-teal-500`
- **Completed**: `bg-emerald-500`
- **Return**: `bg-orange-500`

## Typography

### Font Sizes

- **Page Title**: `text-2xl font-bold`
- **Card Value**: `text-2xl font-bold` (stats) / `text-3xl font-bold` (status counts)
- **Card Label**: `text-sm font-medium text-muted-foreground`
- **Section Title**: `text-base font-semibold`
- **Body Text**: `text-sm`
- **Small Text**: `text-xs`

### Font Weights

- **Bold**: 700 - Main values and titles
- **Semibold**: 600 - Section headings
- **Medium**: 500 - Labels and secondary text
- **Normal**: 400 - Body text

## Spacing

### Vertical Spacing

- **Section Gap**: `space-y-6` (24px between sections)
- **Card Internal**: `p-6` (24px padding)
- **Compact Cards**: `p-4` (16px padding)

### Horizontal Spacing

- **Grid Gap**: `gap-4` (16px) or `gap-6` (24px)
- **Button Gap**: `gap-2` (8px)
- **Icon-Text Gap**: `gap-2` or `gap-3`

## Responsive Breakpoints

### Grid Layouts

- **Mobile** (default): 1 column
- **md:** (768px): 2 columns for stats
- **lg:** (1024px): 4 columns for stats, 3 columns for chart section

### Table Behavior

- **Mobile**: Horizontal scroll
- **Desktop**: Full width, no scroll

## Shadows & Borders

### Cards

- **Border**: `border` with theme-aware color
- **Background**: `bg-card` (theme-aware)
- **Shadow**: Minimal, using border only

### Hover Effects

- **Table Rows**: `hover:bg-muted/50`
- **Buttons**: Built-in Shadcn hover states

## Icons Used

From `lucide-react`:

- **CalendarDays**: Date range button
- **Download**: Export button
- **ChevronRight**: Navigation arrows
- **ChevronDown**: Dropdown indicators
- **ArrowUp** / **ArrowDown**: Trend indicators
- **RefreshCcw**: Refresh action (legacy)

## Animation

### Loading States

- **Pulse**: `animate-pulse` on skeleton elements
- **Spin**: `animate-spin` on loading spinner

### Transitions

- **Progress Bars**: `transition-all`
- **Chart Elements**: Built-in Recharts animations

## Accessibility Features

1. **Semantic HTML**: Proper heading hierarchy (h1, h2, h3)
2. **ARIA Labels**: Via Radix UI primitives
3. **Keyboard Navigation**: Tab order maintained
4. **Color Contrast**: WCAG AA compliant
5. **Focus Indicators**: Visible focus rings

## Theme Compatibility

All components support both light and dark themes via:

- CSS custom properties (`--background`, `--foreground`, etc.)
- `dark:` Tailwind modifiers where needed
- Theme-aware Shadcn components

---

This mapping ensures 1:1 visual parity with the reference design while adapting the data model to the Super Admin context.
