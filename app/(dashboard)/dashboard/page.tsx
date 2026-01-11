/*eslint-disable */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { dashboardApi, productsApi, ordersApi, clientsApi } from '@/lib/api';
import { useCurrency } from '@/hooks/use-currency';

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { format: formatCurrency } = useCurrency();

  // Fetch real data
  const { data: productsStats, isLoading: productsLoading } = useQuery({
    queryKey: ['products-stats'],
    queryFn: () => productsApi.getStats(),
  });

  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock-products'],
    queryFn: () => productsApi.getLowStock(),
  });

  const { data: ordersStats, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders-stats'],
    queryFn: () => ordersApi.getStats(),
  });

  const { data: recentOrders, isLoading: recentOrdersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => ordersApi.getRecent(5),
  });

  const { data: activeOrders, isLoading: activeOrdersLoading } = useQuery({
    queryKey: ['active-orders'],
    queryFn: async () => {
      const [confirmedRes, progressRes] = await Promise.all([
        ordersApi.getAll({ status: 'CONFIRMED', take: 100 }),
        ordersApi.getAll({ status: 'IN_PROGRESS', take: 100 }),
      ]);
      return [...confirmedRes.data, ...progressRes.data];
    },
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientsApi.getAll({ take: 1000 }),
  });

  const activeClients = clients?.data?.filter((c) => c.status === 'ACTIVE').length || 0;
  const totalClients = clients?.data?.length || 0;

  const getOrderStatusColor = (status: string | undefined) => {
    const statusKey = status?.toUpperCase() || 'DRAFT';
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return colors[statusKey] || colors.DRAFT;
  };

  const getOrderStatusIcon = (status: string | undefined) => {
    const statusKey = status?.toUpperCase() || 'DRAFT';
    switch (statusKey) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'CANCELLED':
        return <XCircle className="h-3 w-3" />;
      case 'IN_PROGRESS':
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{t('dashboard.subtitle')}</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalSales')}
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
                  {formatCurrency(ordersStats?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600 font-medium">+12.5%</span>
                  <span>{t('dashboard.fromLastMonth')}</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalOrders')}
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
                <div className="text-3xl font-bold">{ordersStats?.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="text-blue-600 font-medium">
                    {ordersStats?.confirmedOrders || 0}
                  </span>{' '}
                  confirmées,{' '}
                  <span className="text-yellow-600 font-medium">
                    {ordersStats?.draftOrders || 0}
                  </span>{' '}
                  en attente
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Inventory Value */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.inventoryValue')}
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-3xl font-bold">{productsStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {productsStats?.rawMaterials || 0} matières,{' '}
                  {productsStats?.finishedProducts || 0} produits
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Clients */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.activeClients')}
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{activeClients}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalClients} clients au total
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('inventory.stats.lowStock')}</CardTitle>
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                  {productsStats?.lowStock || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('inventory.stats.needsAttention')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => router.push('/dashboard/inventory/alerts')}
                >
                  {t('common.viewAll')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Commandes Terminées</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {ordersStats?.completedOrders || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(ordersStats?.totalRevenue || 0)} générés
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => router.push('/dashboard/orders')}
                >
                  {t('common.viewAll')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Dépenses Fournisseurs</CardTitle>
              <TrendingDown className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                  {formatCurrency(ordersStats?.totalExpenses || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {ordersStats?.supplierOrders || 0} commandes
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => router.push('/dashboard/orders?type=supplier')}
                >
                  {t('common.viewAll')}
                </Button>
              </>
            )}
          </CardContent>
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
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  {t('dashboard.lowStockAlerts')}
                </CardTitle>
                <CardDescription className="mt-1">
                  Produits nécessitant un réapprovisionnement
                </CardDescription>
              </div>
              {!lowStockLoading && lowStockProducts && lowStockProducts.length > 0 && (
                <Badge variant="destructive" className="h-6">
                  {lowStockProducts.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {lowStockLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{product.name}</p>
                        {product.sku && (
                          <Badge variant="outline" className="text-xs">
                            {product.sku}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">Stock:</span>
                          <span className="font-medium text-orange-600">
                            {Number(product.currentStock).toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">
                            / {Number(product.minStock).toFixed(2)} {product.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/dashboard/inventory/movements/new?productId=${product.id}`)
                      }
                    >
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun produit en stock faible</p>
              </div>
            )}
            {!lowStockLoading && lowStockProducts && lowStockProducts.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push('/dashboard/inventory')}
              >
                {t('dashboard.viewAllProducts')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  {t('dashboard.recentOrders')}
                </CardTitle>
                <CardDescription className="mt-1">Dernières commandes clients</CardDescription>
              </div>
              {!recentOrdersLoading && recentOrders && recentOrders.length > 0 && (
                <Badge variant="secondary" className="h-6">
                  {recentOrders.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentOrdersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.orderNumber}</p>
                        <Badge
                          className={`text-xs ${getOrderStatusColor(typeof order.status === 'string' ? order.status : (order.status as any)?.slug || 'DRAFT')}`}
                        >
                          <span className="flex items-center gap-1">
                            {getOrderStatusIcon(
                              typeof order.status === 'string'
                                ? order.status
                                : (order.status as any)?.slug || 'DRAFT'
                            )}
                            {typeof order.status === 'string'
                              ? order.status
                              : (order.status as any)?.name || 'Unknown'}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.clientId ? 'Client' : 'Fournisseur'} •{' '}
                        {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune commande récente</p>
              </div>
            )}
            {!recentOrdersLoading && recentOrders && recentOrders.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push('/dashboard/orders')}
              >
                {t('dashboard.viewAllOrders')}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
