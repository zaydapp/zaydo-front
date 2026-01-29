'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLowStockAlerts } from '@/lib/api/inventory';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { AlertTriangle, Plus, ArrowLeft, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryAlertsPage() {
  const { t } = useTranslation();
  const {
    data: lowStockAlerts,
    isLoading: alertsLoading,
    error: alertsError,
  } = useLowStockAlerts();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'LOW':
        return 'secondary';
      case 'OUT_OF_STOCK':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (alertsError) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/dashboard/inventory">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{t('inventory.alerts')}</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('common.error')}</h3>
              <p>{t('inventory.alertsError')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/inventory">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{t('inventory.alerts')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            {t('inventory.lowStockAlerts')}
            {!alertsLoading && lowStockAlerts && (
              <Badge variant="secondary">
                {lowStockAlerts.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {t('inventory.lowStockDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !lowStockAlerts || lowStockAlerts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">{t('inventory.noAlerts')}</h3>
              <p className="text-muted-foreground">{t('inventory.noAlertsDescription')}</p>
              <Link href="/dashboard/inventory/movements/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('inventory.addStockMovement')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockAlerts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{product.name}</h4>
                      {product.sku && (
                        <Badge variant="outline" className="text-xs">
                          {product.sku}
                        </Badge>
                      )}
                      <Badge variant={getStatusBadgeVariant(product.currentStock <= 0 ? 'OUT_OF_STOCK' : 'LOW')}>
                        {t(`inventory.status.${product.currentStock <= 0 ? 'out_of_stock' : 'low'}`)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        {t('inventory.currentStock')}: <span className="font-medium">{product.currentStock}</span> {product.unit} |{' '}
                        {t('inventory.minStock')}: <span className="font-medium">{product.minStock}</span> {product.unit}
                        {product.shortage && product.shortage > 0 && (
                          <span className="text-yellow-600 ml-2 font-medium">
                            ({t('inventory.shortage')}: {product.shortage} {product.unit})
                          </span>
                        )}
                      </div>
                      <div>
                        {t('products.type')}: {t(`products.types.${product.type.toLowerCase()}`)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/inventory/movements/new?productId=${product.id}`}>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        {t('inventory.addStock')}
                      </Button>
                    </Link>
                    <Link href={`/dashboard/products/${product.id}/edit`}>
                      <Button size="sm" variant="ghost">
                        {t('common.edit')}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
