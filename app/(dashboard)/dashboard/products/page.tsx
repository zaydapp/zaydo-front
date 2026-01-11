'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, Eye, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProductsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Fetch product types from tenant settings
  const { data: settingsData } = useTenantSettings('products');
  const productTypesSetting = settingsData?.find((s) => s.key === 'products.types');
  const productTypes = (productTypesSetting?.value as Array<{ value: string; label: string }>) || [
    { value: 'FINISHED_PRODUCT', label: 'Finished Product' },
    { value: 'RAW_MATERIAL', label: 'Raw Material' },
  ];

  const [activeTab, setActiveTab] = useState<string>(productTypes[0]?.value || 'FINISHED_PRODUCT');

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, activeTab],
    queryFn: () =>
      productsApi.getAll({
        search,
        type: activeTab as 'FINISHED_PRODUCT' | 'RAW_MATERIAL',
        take: 50,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('products.productDeleted'));
    },
    onError: () => {
      toast.error(t('products.deleteError'));
    },
  });

  const handleEdit = (product: Product) => {
    router.push(`/dashboard/products/${product.id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('products.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  const isLowStock = (product: Product) => {
    return Number(product.currentStock) < Number(product.minStock);
  };

  const getStockPercentage = (product: Product) => {
    const current = Number(product.currentStock);
    const min = Number(product.minStock);
    if (min === 0) return 100;
    return Math.round((current / (min * 2)) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('products.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('products.subtitle')}</p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/products/new')}
          size="default"
          className="shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('products.addProduct')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="space-y-6">
        <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10 -mx-6 px-6 pb-0">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-3">
            {productTypes.map((type) => {
              const valueKey = type.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const translationKey = `settings.settingValues.products.${valueKey}`;
              const label = t(translationKey) !== translationKey ? t(translationKey) : type.label;
              const isActive = activeTab === type.value;

              return (
                <button
                  key={type.value}
                  onClick={() => setActiveTab(type.value)}
                  className={`relative px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-t-lg ${
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="relative z-10">{label}</span>
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-3 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {productTypes.map((type) => (
          <TabsContent key={type.value} value={type.value} className="space-y-6 mt-6">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('products.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-background shadow-sm border-muted"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {data?.pagination.total || 0}{' '}
                {t('common.results', { count: data?.pagination.total || 0 })}
              </div>
            </div>

            {/* Products Table */}
            <ProductsTable
              products={data?.data || []}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={(id) => router.push(`/dashboard/products/${id}`)}
              deleteMutation={deleteMutation}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface ProductsTableProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  deleteMutation: { isPending?: boolean; mutate: (id: string) => void };
}

function ProductsTable({
  products,
  isLoading,
  onEdit,
  onDelete,
  onView,
  deleteMutation,
}: ProductsTableProps) {
  const { t } = useTranslation();

  const isLowStock = (product: Product) => {
    return Number(product.currentStock) < Number(product.minStock);
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">{t('products.product')}</TableHead>
            <TableHead className="font-semibold">{t('products.type')}</TableHead>
            <TableHead className="font-semibold">{t('products.sku')}</TableHead>
            <TableHead className="font-semibold">{t('products.unit')}</TableHead>
            <TableHead className="font-semibold">{t('products.currentStock')}</TableHead>
            <TableHead className="font-semibold">{t('products.minStock')}</TableHead>
            <TableHead className="font-semibold">{t('products.status')}</TableHead>
            <TableHead className="text-right font-semibold">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-muted p-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('products.noProducts')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('products.noProductsDescription')}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[product.mainImageIndex || 0]}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={product.type === 'RAW_MATERIAL' ? 'secondary' : 'default'}
                    className="font-normal"
                  >
                    {(() => {
                      const valueKey = product.type.toLowerCase().replace(/[^a-z0-9]/g, '_');
                      const translationKey = `settings.settingValues.products.${valueKey}`;
                      const translated = t(translationKey);
                      return translated !== translationKey ? translated : product.type;
                    })()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <code className="text-sm text-muted-foreground">{product.sku || '-'}</code>
                </TableCell>
                <TableCell className="text-muted-foreground">{product.unit}</TableCell>
                <TableCell>
                  <span
                    className={
                      isLowStock(product) ? 'text-destructive font-medium' : 'text-muted-foreground'
                    }
                  >
                    {Number(product.currentStock).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {Number(product.minStock).toFixed(2)}
                </TableCell>
                <TableCell>
                  {isLowStock(product) ? (
                    <Badge variant="destructive" className="gap-1 font-normal">
                      <AlertTriangle className="h-3 w-3" />
                      {t('products.lowStock')}
                    </Badge>
                  ) : (
                    <Badge variant="default" className="font-normal">
                      {t('products.inStock')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(product.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(product)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(product.id)}
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
