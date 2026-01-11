'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  FileText,
  Tag,
  Boxes,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { productsApi } from '@/lib/api';
import { Product, StockMovement } from '@/types';
import { format } from 'date-fns';
import { useState } from 'react';
import { ImageCarousel } from '@/components/ui/image-carousel';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const productId = params.id as string;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch product details
  const {
    data: product,
    isLoading,
    isError,
  } = useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId),
  });

  // Fetch stock movements for this product
  const { data: movementsData } = useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: () => productsApi.getStockMovements({ productId, take: 10 }),
  });

  const movements = movementsData?.data || [];

  // Delete mutation
  const handleDelete = async () => {
    try {
      await productsApi.delete(productId);
      toast.success(t('products.productDeleted'));
      router.push('/dashboard/products');
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error(t('products.deleteError'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">{t('products.notFound')}</p>
          <Button onClick={() => router.push('/dashboard/products')}>{t('common.goBack')}</Button>
        </div>
      </div>
    );
  }

  const isLowStock = product.currentStock <= product.minStock;
  const stockPercentage = (product.currentStock / (product.minStock * 2)) * 100;

  // Calculate stock movement stats
  const totalIn = movements.filter((m) => m.type === 'IN').reduce((sum, m) => sum + m.quantity, 0);
  const totalOut = movements
    .filter((m) => m.type === 'OUT')
    .reduce((sum, m) => sum + m.quantity, 0);
  const netMovement = totalIn - totalOut;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/products')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">{t(`products.types.${product.type}`)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/products/${productId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      {/* Stock Status Alert */}
      {isLowStock && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">{t('products.lowStockWarning')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('products.lowStockHint')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('products.currentStock')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {product.currentStock} {product.unit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('products.minStock')}: {product.minStock} {product.unit}
            </p>
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${isLowStock ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('products.stats.totalIn')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{totalIn} {product.unit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('products.stats.incomingStock')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('products.stats.totalOut')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{totalOut} {product.unit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('products.stats.outgoingStock')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('products.stats.netMovement')}</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {netMovement >= 0 ? '+' : ''}
              {netMovement} {product.unit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('products.stats.last10Movements')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Images and Product Info Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product Images */}
        {product.images && product.images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {t('products.productImages')}
              </CardTitle>
              <CardDescription>
                {product.images.length} {product.images.length === 1 ? 'image' : 'images'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageCarousel
                images={product.images}
                alt={product.name}
                mainImageIndex={product.mainImageIndex || 0}
                showMainBadge={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('products.productInformation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t('products.type')}
                </label>
                <div className="mt-1">
                  <Badge variant={product.type === 'FINISHED_PRODUCT' ? 'default' : 'secondary'}>
                    {t(`products.types.${product.type}`)}
                  </Badge>
                </div>
              </div>
              {product.sku && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('products.sku')}
                  </label>
                  <p className="mt-1 font-medium">{product.sku}</p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('products.unit')}
              </label>
              <p className="mt-1 font-medium">{product.unit}</p>
            </div>

            {product.description && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('products.description')}
                  </label>
                  <p className="mt-1 text-sm">{product.description}</p>
                </div>
              </>
            )}

            {product.supplierId && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('products.supplier')}
                  </label>
                  <p className="mt-1 font-medium">{product.supplierId}</p>
                </div>
              </>
            )}

            {product.notes && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('products.notes')}
                  </label>
                  <p className="mt-1 text-sm text-muted-foreground">{product.notes}</p>
                </div>
              </>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <label className="font-medium">{t('common.createdAt')}</label>
                <p className="mt-1">{format(new Date(product.createdAt), 'PPp')}</p>
              </div>
              <div>
                <label className="font-medium">{t('common.updatedAt')}</label>
                <p className="mt-1">{format(new Date(product.updatedAt), 'PPp')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Stock Movements - Full Width Below */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('products.recentMovements')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/products/stock-movements')}
            >
              {t('common.viewAll')}
            </Button>
          </div>
          <CardDescription>{t('products.last10Movements')}</CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('products.noMovements')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          movement.type === 'IN'
                            ? 'default'
                            : movement.type === 'OUT'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {t(`products.movementTypes.${movement.type}`)}
                      </Badge>
                      <span
                        className={`font-semibold ${
                          movement.type === 'IN' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {movement.type === 'IN' ? '+' : '-'}
                        {movement.quantity} {product.unit}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{movement.reason}</p>
                    {movement.notes && (
                      <p className="text-xs text-muted-foreground italic">{movement.notes}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(movement.createdAt), 'PP')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(movement.createdAt), 'p')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('products.deleteProduct')}</DialogTitle>
            <DialogDescription>
              {t('products.deleteConfirmation', { name: product.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
