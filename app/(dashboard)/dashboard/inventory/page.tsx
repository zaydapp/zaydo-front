'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  useProductStats, 
  useStockSummary, 
  useLowStockAlerts 
} from '@/lib/api/inventory';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { 
  Package, 
  AlertTriangle, 
  Plus,
  FileText,
  Activity
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading, error: statsError } = useProductStats();
  const { data: lowStockAlerts, isLoading: alertsLoading, error: alertsError } = useLowStockAlerts();
  const { data: stockSummary, isLoading: summaryLoading, error: summaryError } = useStockSummary();

  // Log for debugging
  console.log('Inventory Page - Stats:', { stats, statsLoading, statsError });
  console.log('Inventory Page - Low Stock:', { lowStockAlerts, alertsLoading, alertsError });
  console.log('Inventory Page - Summary:', { stockSummary, summaryLoading, summaryError });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'LOW':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'OUT':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OK':
        return t('inventory.status.ok');
      case 'LOW':
        return t('inventory.status.low');
      case 'OUT':
        return t('inventory.status.out');
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('inventory.title')}</h1>
          <p className="text-muted-foreground">
            {t('inventory.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/inventory/movements/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('inventory.addMovement')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('inventory.stats.totalProducts')}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.rawMaterials || 0} {t('inventory.stats.rawMaterials')}, {stats?.finishedProducts || 0} {t('inventory.stats.finishedProducts')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('inventory.stats.lowStock')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats?.lowStock || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('inventory.stats.needsAttention')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('inventory.stats.movements')}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <Link href="/dashboard/inventory/movements" className="text-xs text-primary hover:underline">
              {t('inventory.viewAll')}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('inventory.stats.reports')}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="mt-2">
              {t('inventory.exportReport')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts && lowStockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              {t('inventory.lowStockAlerts')}
            </CardTitle>
            <CardDescription>
              {t('inventory.lowStockDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertsLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : (
                lowStockAlerts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{product.name}</h4>
                        {product.sku && (
                          <Badge variant="outline" className="text-xs">
                            {product.sku}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('inventory.currentStock')}: {product.currentStock} {product.unit} | {' '}
                        {t('inventory.minStock')}: {product.minStock} {product.unit}
                        {product.shortage && product.shortage > 0 && (
                          <span className="text-yellow-600 ml-2">
                            ({t('inventory.shortage')}: {product.shortage} {product.unit})
                          </span>
                        )}
                      </p>
                    </div>
                    <Link href={`/dashboard/inventory/movements/new?productId=${product.id}`}>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        {t('inventory.addStock')}
                      </Button>
                    </Link>
                  </div>
                ))
              )}
              {!alertsLoading && lowStockAlerts.length > 5 && (
                <Link href="/dashboard/inventory/alerts">
                  <Button variant="link" className="w-full">
                    {t('inventory.viewAllAlerts')} ({lowStockAlerts.length})
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Stock Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('inventory.stockOverview')}</CardTitle>
          <CardDescription>
            {t('inventory.stockOverviewDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {summaryLoading ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : stockSummary && stockSummary.length > 0 ? (
              <>
                <div className="grid grid-cols-5 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
                  <div>{t('inventory.table.product')}</div>
                  <div className="text-center">{t('inventory.table.sku')}</div>
                  <div className="text-center">{t('inventory.table.currentStock')}</div>
                  <div className="text-center">{t('inventory.table.minStock')}</div>
                  <div className="text-center">{t('inventory.table.status')}</div>
                </div>
                {stockSummary.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-5 gap-4 py-3 border-b last:border-0 items-center"
                  >
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.type}</div>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {item.sku || '-'}
                    </div>
                    <div className="text-center font-medium">
                      {item.currentStock} {item.unit}
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {item.minStock} {item.unit}
                    </div>
                    <div className="text-center">
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusText(item.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/products">
                  <Button variant="link" className="w-full">
                    {t('inventory.viewAllProducts')}
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('inventory.noProducts')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
