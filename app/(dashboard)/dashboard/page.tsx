/*eslint-disable */
'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { dashboardApi, productsApi, ordersApi, clientsApi, orderStatusesApi } from '@/lib/api';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';

type PeriodFilter = 'current_month' | 'previous_month' | 'custom';
type ChartPeriodFilter = 'this_year' | 'past_year' | 'custom';
type ChartType = 'bar' | 'line' | 'area' | 'pie';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { format: formatCurrency, options: currencyOptions } = useCurrency();

  // Compact Y-axis formatter to prevent label wrapping (no decimals, non-breaking spaces)
  const formatAxisTick = (v: number) =>
    formatCurrencyUtil(v, { ...currencyOptions, decimals: 0 }).replace(/\s/g, '\u00A0');

  const [period, setPeriod] = useState<PeriodFilter>('current_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriodFilter>('this_year');
  const [chartCustomStart, setChartCustomStart] = useState('');
  const [chartCustomEnd, setChartCustomEnd] = useState('');
  const [chartType, setChartType] = useState<ChartType>('bar');

  const statsParams = useMemo(() => {
    if (period === 'custom' && customStart && customEnd) {
      return { period: 'custom' as const, startDate: customStart, endDate: customEnd };
    }
    return { period: period === 'custom' ? 'current_month' : period };
  }, [period, customStart, customEnd]);

  const periodLabel = useMemo(() => {
    if (period === 'current_month') return t('dashboard.period.thisMonth');
    if (period === 'previous_month') return t('dashboard.period.previousMonth');
    if (period === 'custom' && customStart && customEnd) {
      const locale = i18n.language?.startsWith('fr') ? 'fr-FR' : 'en-GB';
      return `${new Date(customStart).toLocaleDateString(locale)} - ${new Date(customEnd).toLocaleDateString(locale)}`;
    }
    return t('dashboard.period.thisMonth');
  }, [period, customStart, customEnd, t, i18n.language]);

  // Fetch real data
  const { data: productsStats, isLoading: productsLoading } = useQuery({
    queryKey: ['products-stats'],
    queryFn: () => productsApi.getStats(),
  });

  const chartParams = useMemo(() => {
    if (chartPeriod === 'custom' && chartCustomStart && chartCustomEnd) {
      return { period: 'custom' as const, startDate: chartCustomStart, endDate: chartCustomEnd };
    }
    return { period: chartPeriod === 'custom' ? 'this_year' : chartPeriod };
  }, [chartPeriod, chartCustomStart, chartCustomEnd]);

  const { data: revenueChartData, isLoading: revenueChartLoading } = useQuery({
    queryKey: ['revenue-chart', chartParams],
    queryFn: () => ordersApi.getRevenueChart(chartParams),
  });

  const { data: expensesChartData, isLoading: expensesChartLoading } = useQuery({
    queryKey: ['expenses-chart', chartParams],
    queryFn: () => ordersApi.getExpensesChart(chartParams),
  });

  const { data: ordersStats, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders-stats', statsParams],
    queryFn: () => ordersApi.getStats(statsParams),
  });

  const { data: orderStatuses } = useQuery({
    queryKey: ['order-statuses'],
    queryFn: () => orderStatusesApi.getAll(),
  });

  const { data: activeOrders, isLoading: activeOrdersLoading } = useQuery({
    queryKey: ['active-orders'],
    queryFn: async () => {
      if (!orderStatuses) return [];

      // Get active statuses (confirmed and processing)
      const activeStatusSlugs = orderStatuses
        .filter((status) => status.slug === 'confirmed' || status.slug === 'processing')
        .map((status) => status.slug);

      const promises = activeStatusSlugs.map((status) =>
        ordersApi.getAll({ status: status as string, take: 100 })
      );

      const responses = await Promise.all(promises);
      return responses.flatMap((response) => response.data);
    },
    enabled: !!orderStatuses,
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientsApi.getAll({ take: 1000 }),
  });

  const activeClients = clients?.data?.filter((c) => c.status === 'ACTIVE').length || 0;
  const totalClients = clients?.data?.length || 0;

  const getOrderStatusColor = (status: string | undefined) => {
    const statusKey = status?.toLowerCase() || 'pending';
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return colors[statusKey] || colors.pending;
  };

  const getOrderStatusIcon = (status: string | undefined) => {
    const statusKey = status?.toLowerCase() || 'pending';
    switch (statusKey) {
      case 'delivered':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      case 'processing':
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={period}
            onValueChange={(v) => {
              setPeriod(v as PeriodFilter);
              if (v === 'custom') {
                const now = new Date();
                const first = new Date(now.getFullYear(), now.getMonth(), 1);
                setCustomStart(first.toISOString().split('T')[0]);
                setCustomEnd(now.toISOString().split('T')[0]);
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">{t('dashboard.period.thisMonth')}</SelectItem>
              <SelectItem value="previous_month">{t('dashboard.period.previousMonth')}</SelectItem>
              <SelectItem value="custom">{t('dashboard.period.custom')}</SelectItem>
            </SelectContent>
          </Select>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                  {t('dashboard.period.from')}
                </Label>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-9 w-[140px]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                  {t('dashboard.period.to')}
                </Label>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-9 w-[140px]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Chiffre d'affaires - Total client orders current month */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.revenue')}
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {formatCurrency(ordersStats?.monthlyRevenue ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  {ordersStats?.revenueChangePercent != null &&
                  ordersStats.revenueChangePercent !== 0 ? (
                    <>
                      {ordersStats.revenueChangePercent >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span
                        className={
                          ordersStats.revenueChangePercent >= 0
                            ? 'text-green-600 font-medium'
                            : 'text-red-600 font-medium'
                        }
                      >
                        {ordersStats.revenueChangePercent >= 0 ? '+' : ''}
                        {ordersStats.revenueChangePercent.toFixed(1)}%
                      </span>
                    </>
                  ) : null}
                  <span>{t('dashboard.fromLastMonth')}</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dépenses - Total supplier orders + divers in current month */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.expenses')}
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {formatCurrency(ordersStats?.totalMonthlyExpenses ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {ordersStats?.monthlySupplierOrders ?? 0} cmd. fournisseur
                  {(ordersStats?.monthlyDivers ?? 0) > 0 && (
                    <> + {formatCurrency(ordersStats?.monthlyDivers ?? 0)} divers</>
                  )}{' '}
                  {periodLabel}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bénéfices Net = Chiffre d'affaires - Dépenses (current month) */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.netProfit')}
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div
                  className={`text-3xl font-bold ${
                    (ordersStats?.monthlyRevenue ?? 0) - (ordersStats?.totalMonthlyExpenses ?? 0) >=
                    0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCurrency(
                    (ordersStats?.monthlyRevenue ?? 0) - (ordersStats?.totalMonthlyExpenses ?? 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('dashboard.revenueMinusExpenses')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="py-3 px-4 flex flex-row items-center gap-3 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
          <ShoppingCart className="h-4 w-4 shrink-0 text-blue-600" />
          {ordersLoading ? (
            <Skeleton className="h-5 flex-1" />
          ) : (
            <span className="text-sm">
              <span className="font-medium">Commandes Clients</span>
              {' — '}
              <span className="text-blue-700 dark:text-blue-400 font-semibold">
                {ordersStats?.monthlyClientOrders ?? 0}
              </span>
              {' commandes · '}
              <span className="text-muted-foreground">
                {formatCurrency(ordersStats?.monthlyRevenue ?? 0)} générés ({periodLabel})
              </span>
            </span>
          )}
        </Card>

        <Card className="py-3 px-4 flex flex-row items-center gap-3 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          {ordersLoading ? (
            <Skeleton className="h-5 flex-1" />
          ) : (
            <span className="text-sm">
              <span className="font-medium">Commandes Fournisseurs</span>
              {' — '}
              <span className="text-green-700 dark:text-green-400 font-semibold">
                {ordersStats?.monthlySupplierOrders ?? 0}
              </span>
              {' commandes · '}
              <span className="text-muted-foreground">
                {formatCurrency(ordersStats?.monthlySupplierExpenses ?? 0)} dépensés ({periodLabel})
              </span>
            </span>
          )}
        </Card>
      </div>

      {/* Active Orders Section */}
      {!activeOrdersLoading && activeOrders && activeOrders.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Commandes en Cours
                </CardTitle>
                <CardDescription className="mt-1">
                  Commandes confirmées et en traitement
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200"
              >
                {activeOrders.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeOrders.slice(0, 8).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-800 p-3 hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/orders/${order.id}/edit`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{order.orderNumber}</p>
                      <Badge
                        className={`text-xs ${getOrderStatusColor(typeof order.status === 'string' ? order.status : (order.status as any)?.slug || 'CONFIRMED')}`}
                      >
                        <span className="flex items-center gap-1">
                          {getOrderStatusIcon(
                            typeof order.status === 'string'
                              ? order.status
                              : (order.status as any)?.slug || 'CONFIRMED'
                          )}
                          {typeof order.status === 'string'
                            ? order.status
                            : (order.status as any)?.name || 'Confirmée'}
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{order.clientId ? 'Client' : 'Fournisseur'}</span>
                      <span>{new Date(order.orderDate).toLocaleDateString('fr-FR')}</span>
                      {order.deliveryDate && (
                        <span className="text-amber-700 dark:text-amber-300 font-medium">
                          Livr. {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/orders/${order.id}/edit`);
                      }}
                    >
                      Éditer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {activeOrders.length > 8 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push('/dashboard/orders')}
              >
                Voir toutes les commandes ({activeOrders.length})
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chiffre d'affaires Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  {t('dashboard.revenue')}
                </CardTitle>
                <CardDescription className="mt-1">
                  {t('dashboard.revenueChartDescription')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">{t('dashboard.chartType.bar')}</SelectItem>
                    <SelectItem value="line">{t('dashboard.chartType.line')}</SelectItem>
                    <SelectItem value="area">{t('dashboard.chartType.area')}</SelectItem>
                    <SelectItem value="pie">{t('dashboard.chartType.pie')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={chartPeriod}
                  onValueChange={(v) => {
                    setChartPeriod(v as ChartPeriodFilter);
                    if (v === 'custom') {
                      const now = new Date();
                      const first = new Date(now.getFullYear(), 0, 1);
                      setChartCustomStart(first.toISOString().split('T')[0]);
                      setChartCustomEnd(now.toISOString().split('T')[0]);
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_year">{t('dashboard.chartPeriod.thisYear')}</SelectItem>
                    <SelectItem value="past_year">{t('dashboard.chartPeriod.pastYear')}</SelectItem>
                    <SelectItem value="custom">{t('dashboard.chartPeriod.custom')}</SelectItem>
                  </SelectContent>
                </Select>
                {chartPeriod === 'custom' && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="date"
                      value={chartCustomStart}
                      onChange={(e) => setChartCustomStart(e.target.value)}
                      className="h-9 w-[130px]"
                    />
                    <Input
                      type="date"
                      value={chartCustomEnd}
                      onChange={(e) => setChartCustomEnd(e.target.value)}
                      className="h-9 w-[130px]"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {revenueChartLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : revenueChartData && revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'pie' ? (
                  <PieChart>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={revenueChartData.map((d) => ({ name: d.label, value: d.revenue }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {revenueChartData.map((_, i) => (
                        <Cell key={i} fill={`hsl(${150 + i * 25}, 70%, 45%)`} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number) => [formatCurrency(value), t('dashboard.revenue')]}
                    />
                  </PieChart>
                ) : chartType === 'line' ? (
                  <LineChart
                    data={revenueChartData}
                    margin={{ top: 16, right: 16, left: 8, bottom: 24 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      width={72}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatAxisTick}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number) => [formatCurrency(value), t('dashboard.revenue')]}
                      labelFormatter={(label) => label}
                      cursor={{ fill: 'var(--muted)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      dot={{ fill: '#14b8a6', r: 4 }}
                    />
                  </LineChart>
                ) : chartType === 'area' ? (
                  <AreaChart
                    data={revenueChartData}
                    margin={{ top: 16, right: 16, left: 8, bottom: 24 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      width={72}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatAxisTick}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number) => [formatCurrency(value), t('dashboard.revenue')]}
                      labelFormatter={(label) => label}
                      cursor={{ fill: 'var(--muted)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      fill="url(#revenueGradient)"
                      stroke="#14b8a6"
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={revenueChartData}
                    margin={{ top: 16, right: 16, left: 8, bottom: 24 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      width={72}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatAxisTick}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number) => [formatCurrency(value), t('dashboard.revenue')]}
                      labelFormatter={(label) => label}
                      cursor={{ fill: 'var(--muted)' }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="url(#revenueGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                <DollarSign className="h-12 w-12 mb-3 opacity-50" />
                <p>{t('dashboard.noRevenueData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dépenses Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-blue-600" />
                  {t('dashboard.expenses')}
                </CardTitle>
                <CardDescription className="mt-1">
                  {t('dashboard.expensesChartDescription')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">{t('dashboard.chartType.bar')}</SelectItem>
                    <SelectItem value="line">{t('dashboard.chartType.line')}</SelectItem>
                    <SelectItem value="area">{t('dashboard.chartType.area')}</SelectItem>
                    <SelectItem value="pie">{t('dashboard.chartType.pie')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={chartPeriod}
                  onValueChange={(v) => {
                    setChartPeriod(v as ChartPeriodFilter);
                    if (v === 'custom') {
                      const now = new Date();
                      const first = new Date(now.getFullYear(), 0, 1);
                      setChartCustomStart(first.toISOString().split('T')[0]);
                      setChartCustomEnd(now.toISOString().split('T')[0]);
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_year">{t('dashboard.chartPeriod.thisYear')}</SelectItem>
                    <SelectItem value="past_year">{t('dashboard.chartPeriod.pastYear')}</SelectItem>
                    <SelectItem value="custom">{t('dashboard.chartPeriod.custom')}</SelectItem>
                  </SelectContent>
                </Select>
                {chartPeriod === 'custom' && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="date"
                      value={chartCustomStart}
                      onChange={(e) => setChartCustomStart(e.target.value)}
                      className="h-9 w-[130px]"
                    />
                    <Input
                      type="date"
                      value={chartCustomEnd}
                      onChange={(e) => setChartCustomEnd(e.target.value)}
                      className="h-9 w-[130px]"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {expensesChartLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : expensesChartData && expensesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'pie' ? (
                  (() => {
                    const supplierTotal = expensesChartData.reduce(
                      (s, d) => s + (d.supplierExpenses ?? 0),
                      0
                    );
                    const diversTotal = expensesChartData.reduce((s, d) => s + (d.divers ?? 0), 0);
                    const pieData = [
                      {
                        name: t('dashboard.expensesChart.supplier'),
                        value: supplierTotal,
                        color: '#0ea5e9',
                      },
                      {
                        name: t('dashboard.expensesChart.divers'),
                        value: diversTotal,
                        color: '#8b5cf6',
                      },
                    ].filter((d) => d.value > 0);
                    return pieData.length > 0 ? (
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {pieData.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                        />
                      </PieChart>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        {t('dashboard.noExpensesData')}
                      </div>
                    );
                  })()
                ) : chartType === 'line' ? (
                  <LineChart
                    data={expensesChartData}
                    margin={{ top: 16, right: 16, left: 8, bottom: 24 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      width={72}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatAxisTick}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      labelFormatter={(label) => label}
                      cursor={{ fill: 'var(--muted)' }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 16 }}
                      formatter={(value) => (
                        <span style={{ color: 'var(--foreground)', fontSize: 12 }}>{value}</span>
                      )}
                      iconType="square"
                      iconSize={10}
                    />
                    <Line
                      type="monotone"
                      dataKey="supplierExpenses"
                      name={t('dashboard.expensesChart.supplier')}
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={{ fill: '#0ea5e9', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="divers"
                      name={t('dashboard.expensesChart.divers')}
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                    />
                  </LineChart>
                ) : chartType === 'area' ? (
                  <AreaChart
                    data={expensesChartData}
                    margin={{ top: 16, right: 16, left: 8, bottom: 24 }}
                  >
                    <defs>
                      <linearGradient id="supplierGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="diversGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      width={72}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatAxisTick}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      labelFormatter={(label) => label}
                      cursor={{ fill: 'var(--muted)' }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 16 }}
                      formatter={(value) => (
                        <span style={{ color: 'var(--foreground)', fontSize: 12 }}>{value}</span>
                      )}
                      iconType="square"
                      iconSize={10}
                    />
                    <Area
                      type="monotone"
                      dataKey="supplierExpenses"
                      name={t('dashboard.expensesChart.supplier')}
                      stackId="a"
                      fill="url(#supplierGradient)"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="divers"
                      name={t('dashboard.expensesChart.divers')}
                      stackId="a"
                      fill="url(#diversGradient)"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={expensesChartData}
                    margin={{ top: 16, right: 16, left: 8, bottom: 24 }}
                  >
                    <defs>
                      <linearGradient id="supplierGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="diversGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      width={72}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatAxisTick}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      labelFormatter={(label) => label}
                      cursor={{ fill: 'var(--muted)' }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 16 }}
                      formatter={(value) => (
                        <span style={{ color: 'var(--foreground)', fontSize: 12 }}>{value}</span>
                      )}
                      iconType="square"
                      iconSize={10}
                    />
                    <Bar
                      dataKey="supplierExpenses"
                      stackId="a"
                      fill="url(#supplierGradient)"
                      radius={[0, 0, 0, 0]}
                      maxBarSize={48}
                      name={t('dashboard.expensesChart.supplier')}
                    />
                    <Bar
                      dataKey="divers"
                      stackId="a"
                      fill="url(#diversGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                      name={t('dashboard.expensesChart.divers')}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                <TrendingDown className="h-12 w-12 mb-3 opacity-50" />
                <p>{t('dashboard.noExpensesData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
