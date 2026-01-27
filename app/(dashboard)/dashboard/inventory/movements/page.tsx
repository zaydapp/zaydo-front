'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useStockMovements, StockMovement, useDeleteStockMovement } from '@/lib/api/inventory';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 20;

export default function StockMovementsPage() {
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'RAW_MATERIAL' | 'FINISHED_PRODUCT' | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const deleteMovementMutation = useDeleteStockMovement();

  const handleDeleteMovement = async (id: string) => {
    if (confirm(t('inventory.movements.confirmDelete'))) {
      try {
        await deleteMovementMutation.mutateAsync(id);
        toast.success(t('inventory.movements.deleteSuccess'));
      } catch (error: unknown) {
        const message =
          typeof error === 'object' && error !== null && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        toast.error(message || t('common.error'));
      }
    }
  };

  // Build params object - explicitly include productType only when not 'ALL'
  const stockMovementsParams = {
    ...(activeTab !== 'ALL' && { productType: activeTab as 'RAW_MATERIAL' | 'FINISHED_PRODUCT' }),
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  };

  // Debug: Log params when they change
  console.log('StockMovements params:', {
    activeTab,
    stockMovementsParams,
    productType: stockMovementsParams.productType,
  });

  const { data, isLoading, refetch } = useStockMovements(stockMovementsParams);

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'IN':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'OUT':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'ADJUSTMENT':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getMovementTypeText = (type: string) => {
    switch (type) {
      case 'IN':
        return t('inventory.movements.in');
      case 'OUT':
        return t('inventory.movements.out');
      case 'ADJUSTMENT':
        return t('inventory.movements.adjustment');
      default:
        return type;
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="h-4 w-4" />;
      case 'OUT':
        return <TrendingDown className="h-4 w-4" />;
      case 'ADJUSTMENT':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const movements: StockMovement[] = data?.data || [];
  const totalMovements = data?.pagination?.total || movements.length;
  const totalPages = Math.ceil(totalMovements / ITEMS_PER_PAGE);

  // Filter by movement type and search (product type is already filtered by API)
  const filteredMovements = movements.filter((movement: StockMovement) => {
    const matchesType = typeFilter === 'all' || movement.type === typeFilter;
    const matchesSearch =
      !searchQuery ||
      movement.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.reference?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value as typeof activeTab);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('inventory.movements.title')}</h1>
          <p className="text-muted-foreground">{t('inventory.movements.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
          <Link href="/dashboard/inventory/movements/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('inventory.movements.add')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10 -mx-6 px-6 pb-0">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-3">
            {['ALL', 'RAW_MATERIAL', 'FINISHED_PRODUCT'].map((tab) => {
              const valueKey = tab.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const translationKey = `settings.settingValues.products.${valueKey}`;
              let label = t(translationKey);
              if (label === translationKey) {
                // Fallback labels
                label =
                  tab === 'ALL'
                    ? t('common.all')
                    : tab === 'RAW_MATERIAL'
                      ? 'Matière première'
                      : 'Produit fini';
              }
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
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

        {['ALL', 'RAW_MATERIAL', 'FINISHED_PRODUCT'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-6 mt-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('common.filters')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('inventory.movements.search')}
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      <SelectItem value="IN">{t('inventory.movements.in')}</SelectItem>
                      <SelectItem value="OUT">{t('inventory.movements.out')}</SelectItem>
                      <SelectItem value="ADJUSTMENT">
                        {t('inventory.movements.adjustment')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Movements List */}
            <Card>
              <CardHeader>
                <CardTitle>{t('inventory.movements.list')}</CardTitle>
                <CardDescription>
                  {t('inventory.movements.total')}: {filteredMovements.length}
                  {totalMovements > filteredMovements.length && ` / ${totalMovements}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : filteredMovements.length > 0 ? (
                  <div className="space-y-3">
                    {filteredMovements.map((movement) => (
                      <div
                        key={movement.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 rounded-lg ${getMovementTypeColor(movement.type)}`}>
                            {getMovementIcon(movement.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{movement.product.name}</h4>
                              {movement.product.sku && (
                                <Badge variant="outline" className="text-xs">
                                  {movement.product.sku}
                                </Badge>
                              )}
                              <Badge className={getMovementTypeColor(movement.type)}>
                                {getMovementTypeText(movement.type)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="font-medium">
                                {movement.type === 'OUT' && '-'}
                                {movement.quantity} {movement.product.unit}
                              </span>
                              {movement.reason && (
                                <span className="flex items-center gap-1">
                                  <span className="text-xs">•</span>
                                  {movement.reason}
                                </span>
                              )}
                              {movement.reference && (
                                <span className="flex items-center gap-1">
                                  <span className="text-xs">•</span>
                                  {movement.reference}
                                </span>
                              )}
                              <span className="flex items-center gap-1 ml-auto">
                                <span className="text-xs">•</span>
                                {format(new Date(movement.createdAt), 'PPp')}
                              </span>
                            </div>
                            {movement.notes && (
                              <p className="text-sm text-muted-foreground mt-1 italic">
                                {movement.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              (window.location.href = `/dashboard/inventory/movements/${movement.id}/edit`)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMovement(movement.id)}
                            disabled={deleteMovementMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || typeFilter !== 'all'
                        ? t('inventory.movements.noResults')
                        : t('inventory.movements.noMovements')}
                    </p>
                    <Link href="/dashboard/inventory/movements/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('inventory.movements.add')}
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Pagination */}
                {!isLoading && filteredMovements.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {t('common.showing')} {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
                      {Math.min(currentPage * ITEMS_PER_PAGE, totalMovements)} {t('common.of')}{' '}
                      {totalMovements} {t('common.results')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {t('common.previous')}
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        {t('common.next')}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
