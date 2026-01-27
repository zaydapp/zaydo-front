'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ordersApi, orderStatusesApi } from '@/lib/api';
import { Order, OrderType, OrderStatusItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Trash2, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/use-currency';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

export default function OrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { format: formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'CLIENT_ORDER' | 'SUPPLIER_ORDER'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Fetch order statuses dynamically
  const { data: orderStatuses } = useQuery({
    queryKey: ['order-statuses'],
    queryFn: () => orderStatusesApi.getAll(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', search, activeTab, selectedStatus],
    queryFn: () =>
      ordersApi.getAll({
        search,
        type: activeTab !== 'ALL' ? (activeTab as OrderType) : undefined,
        status: selectedStatus || undefined,
        take: 50,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: () => ordersApi.getStats(),
  });

  const deleteMutation = useMutation({
    mutationFn: ordersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(t('orders.orderDeleted'));
    },
    onError: () => {
      toast.error(t('orders.deleteError'));
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm(t('orders.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('orders.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('orders.subtitle')}</p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/orders/new')}
          size="default"
          className="shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('orders.addOrder')}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">{t('orders.totalOrders')}</p>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.totalOrders}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">
                {t('orders.clientOrders')}
              </p>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.clientOrders}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(Number(stats.totalRevenue))}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              <p className="text-sm font-medium text-muted-foreground">
                {t('orders.supplierOrders')}
              </p>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.supplierOrders}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(Number(stats.totalExpenses))}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">
                {t('orders.completedOrders')}
              </p>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.completedOrders}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="space-y-6"
      >
        <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10 -mx-6 px-6 pb-0">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-3">
            {['ALL', 'CLIENT_ORDER', 'SUPPLIER_ORDER'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-t-lg ${
                  activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="relative z-10">{t(`orders.${tab.toLowerCase()}`)}</span>
                {activeTab === tab && (
                  <span className="absolute inset-x-0 -bottom-3 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {['ALL', 'CLIENT_ORDER', 'SUPPLIER_ORDER'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-6 mt-6">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('orders.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-background shadow-sm border-muted"
                />
              </div>

              {/* Status Filter */}
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value === 'all' ? '' : value)}
              >
                <SelectTrigger className="w-48 h-10 bg-background shadow-sm border-muted">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {orderStatuses?.map((status) => (
                    <SelectItem key={status.id} value={status.slug}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground">
                {data?.pagination.total || 0}{' '}
                {t('common.results', { count: data?.pagination.total || 0 })}
              </div>
            </div>

            {/* Orders Table */}
            <OrdersTable
              orders={data?.data || []}
              isLoading={isLoading}
              onView={(id) => router.push(`/dashboard/orders/${id}`)}
              onDelete={handleDelete}
              deleteMutation={deleteMutation}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  deleteMutation: { isPending?: boolean; mutate: (id: string) => void };
}

function OrdersTable({ orders, isLoading, onView, onDelete, deleteMutation }: OrdersTableProps) {
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">{t('orders.orderNumber')}</TableHead>
            <TableHead className="font-semibold">{t('orders.type')}</TableHead>
            <TableHead className="font-semibold">{t('orders.customer')}</TableHead>
            <TableHead className="font-semibold">{t('orders.orderDate')}</TableHead>
            <TableHead className="font-semibold">{t('orders.totalAmount')}</TableHead>
            <TableHead className="font-semibold">{t('orders.status')}</TableHead>
            <TableHead className="text-right font-semibold">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-muted p-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('orders.noOrders')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('orders.noOrdersDescription')}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {t(`orders.${order.type.toLowerCase()}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {order.client?.name || order.supplier?.name || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(order.orderDate), 'PP')}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatCurrency(Number(order.totalAmount))}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {(() => {
                      if (!order.status) return t('orders.status.unknown');
                      if (typeof order.status === 'object' && 'slug' in order.status) {
                        return t(`orders.status.${order.status.slug}`);
                      }
                      const statusStr = String(order.status).toLowerCase();
                      return t(`orders.status.${statusStr}`);
                    })()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(order.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(order.id)}
                      disabled={deleteMutation.isPending}
                      className="h-8 w-8 p-0 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
