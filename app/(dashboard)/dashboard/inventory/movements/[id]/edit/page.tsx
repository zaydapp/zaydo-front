'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { useUpdateStockMovement, useStockMovement } from '@/lib/api/inventory';
import { useProducts } from '@/lib/api/products';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, Save, Search } from 'lucide-react';
import Link from 'next/link';

interface StockMovementForm {
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
  reference?: string;
  notes?: string;
}

export default function EditStockMovementPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const movementId = params.id as string;

  const { data: movement, isLoading: movementLoading } = useStockMovement(movementId);
  const { data: productsData } = useProducts({ take: 1000 });
  const products = productsData?.data || [];

  const updateMovementMutation = useUpdateStockMovement();

  // Search state for products
  const [productSearch, setProductSearch] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockMovementForm>({
    defaultValues: {
      productId: '',
      type: 'IN',
      quantity: 0,
      reason: '',
      reference: '',
      notes: '',
    },
  });

  // Populate form when movement data is loaded
  useEffect(() => {
    if (movement) {
      console.log('Movement data loaded:', movement);
      console.log('Movement type from API:', movement.type);
      const formData = {
        productId: movement.productId,
        type: movement.type,
        quantity: Number(movement.quantity),
        reason: movement.reason || '',
        reference: movement.reference || '',
        notes: movement.notes || '',
      };
      console.log('Resetting form with data:', formData);
      reset(formData);
    }
  }, [movement, reset]);

  const selectedProductId = watch('productId');
  const movementType = watch('type');

  // Debug: Log form values
  useEffect(() => {
    console.log('Current form values:', {
      selectedProductId,
      movementType,
      movementData: movement,
    });
  }, [selectedProductId, movementType, movement]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Filter products based on search
  const filteredProducts = products.filter((product) => {
    const searchLower = productSearch.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.sku && product.sku.toLowerCase().includes(searchLower))
    );
  });

  const onSubmit = async (data: StockMovementForm) => {
    try {
      await updateMovementMutation.mutateAsync({
        id: movementId,
        ...data,
        quantity: Number(data.quantity),
      });

      toast.success(t('inventory.movements.updateSuccess'));
      router.push('/dashboard/inventory/movements');
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || t('common.error'));
    }
  };

  if (movementLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-6"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!movement) {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{t('inventory.movements.notFound')}</h1>
          <Link href="/dashboard/inventory/movements">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/inventory/movements">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('inventory.movements.editMovement')}</CardTitle>
            <CardDescription>{t('inventory.movements.editDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Movement Type */}
              <div className="space-y-2">
                <Label htmlFor="type">
                  {t('inventory.movements.type')} <span className="text-red-500">*</span>
                </Label>
                <Controller
                  key={`movement-type-${movementType}`}
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'IN'}
                      onValueChange={(value) => {
                        console.log('Type changed to:', value);
                        field.onChange(value);
                      }}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder={t('inventory.movements.selectType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">{t('inventory.movements.in')}</SelectItem>
                        <SelectItem value="OUT">{t('inventory.movements.out')}</SelectItem>
                        <SelectItem value="ADJUSTMENT">
                          {t('inventory.movements.adjustment')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
              </div>

              {/* Product Selection */}
              <div className="space-y-3">
                <Label htmlFor="productId" className="text-sm font-medium">
                  {t('inventory.movements.product')} <span className="text-red-500">*</span>
                </Label>

                {/* Selected Product Display */}
                {selectedProduct ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
                    <div className="flex-1">
                      <div className="font-medium">{selectedProduct.name}</div>
                      {selectedProduct.sku && (
                        <div className="text-sm text-muted-foreground">
                          SKU: {selectedProduct.sku}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground mt-1">
                        {t('inventory.movements.currentStock')}:{' '}
                        <span className="font-medium">{selectedProduct.currentStock || 0}</span>{' '}
                        {selectedProduct.unit}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setValue('productId', '');
                        setProductSearch('');
                      }}
                    >
                      {t('common.change')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={t('inventory.movements.searchProduct')}
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-10 h-11"
                        autoFocus
                      />
                    </div>

                    {productSearch && (
                      <div className="border rounded-lg shadow-sm bg-background max-h-64 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{t('inventory.movements.noProductsFound')}</p>
                          </div>
                        ) : (
                          <div className="py-1">
                            {filteredProducts.slice(0, 8).map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => {
                                  setValue('productId', product.id);
                                  setProductSearch('');
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{product.name}</div>
                                    {product.sku && (
                                      <div className="text-sm text-muted-foreground">
                                        SKU: {product.sku}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="text-sm font-medium">
                                      {product.currentStock || 0}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {product.unit}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                            {filteredProducts.length > 8 && (
                              <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                                {t('common.showing')} 8 {t('common.of')} {filteredProducts.length}{' '}
                                {t('common.results')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {!productSearch && (
                      <div className="text-center p-6 border-2 border-dashed rounded-lg">
                        <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {t('inventory.movements.startTypingToSearch')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {errors.productId && (
                <p className="text-sm text-red-500">{errors.productId.message}</p>
              )}

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  {t('inventory.movements.quantity')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...register('quantity', {
                    required: t('inventory.movements.quantityRequired'),
                    min: { value: 0.01, message: t('inventory.movements.quantityMin') },
                  })}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-500">{errors.quantity.message}</p>
                )}
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">{t('inventory.movements.reason')}</Label>
                <Input
                  id="reason"
                  placeholder={
                    movementType === 'IN'
                      ? t('inventory.movements.reasonInPlaceholder')
                      : movementType === 'OUT'
                        ? t('inventory.movements.reasonOutPlaceholder')
                        : t('inventory.movements.reasonAdjustmentPlaceholder')
                  }
                  {...register('reason')}
                />
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label htmlFor="reference">{t('inventory.movements.reference')}</Label>
                <Input
                  id="reference"
                  placeholder={t('inventory.movements.referencePlaceholder')}
                  {...register('reference')}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t('inventory.movements.notes')}</Label>
                <Textarea
                  id="notes"
                  placeholder={t('inventory.movements.notesPlaceholder')}
                  rows={3}
                  {...register('notes')}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Link href="/dashboard/inventory/movements">
                  <Button type="button" variant="outline">
                    {t('common.cancel')}
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? t('common.saving') : t('inventory.movements.update')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
