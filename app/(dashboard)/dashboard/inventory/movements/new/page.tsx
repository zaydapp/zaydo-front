'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useForm } from 'react-hook-form';
import { useAddStockMovement } from '@/lib/api/inventory';
import { useProducts } from '@/lib/api/products';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface StockMovementForm {
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
  reference?: string;
  notes?: string;
}

export default function NewStockMovementPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get('productId');

  const { data: productsData } = useProducts({ take: 1000 });
  const products = productsData?.data || [];

  const addMovementMutation = useAddStockMovement();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StockMovementForm>({
    defaultValues: {
      productId: preselectedProductId || '',
      type: 'IN',
      quantity: 0,
      reason: '',
      reference: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (preselectedProductId) {
      setValue('productId', preselectedProductId);
    }
  }, [preselectedProductId, setValue]);

  const selectedProductId = watch('productId');
  const movementType = watch('type');

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const onSubmit = async (data: StockMovementForm) => {
    try {
      await addMovementMutation.mutateAsync({
        ...data,
        quantity: Number(data.quantity),
      });

      toast.success(t('inventory.movements.addSuccess'));
      router.push('/dashboard/inventory/movements');
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || t('common.error'));
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'IN':
        return t('inventory.movements.inDescription');
      case 'OUT':
        return t('inventory.movements.outDescription');
      case 'ADJUSTMENT':
        return t('inventory.movements.adjustmentDescription');
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventory/movements">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('inventory.movements.addNew')}</h1>
          <p className="text-muted-foreground">{t('inventory.movements.addDescription')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{t('inventory.movements.movementDetails')}</CardTitle>
            <CardDescription>{getTypeDescription(movementType)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Movement Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                {t('inventory.movements.type')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as 'IN' | 'OUT' | 'ADJUSTMENT')}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">{t('inventory.movements.in')}</SelectItem>
                  <SelectItem value="OUT">{t('inventory.movements.out')}</SelectItem>
                  <SelectItem value="ADJUSTMENT">{t('inventory.movements.adjustment')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="productId">
                {t('inventory.movements.product')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('productId')}
                onValueChange={(value) => setValue('productId', value)}
              >
                <SelectTrigger id="productId">
                  <SelectValue placeholder={t('inventory.movements.selectProduct')} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} {product.sku && `(${product.sku})`}
                      {product.currentStock !== undefined && (
                        <span className="text-muted-foreground ml-2">
                          - {product.currentStock} {product.unit}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <p className="text-sm text-muted-foreground">
                  {t('inventory.movements.currentStock')}: {selectedProduct.currentStock || 0}{' '}
                  {selectedProduct.unit}
                </p>
              )}
              {errors.productId && (
                <p className="text-sm text-red-500">{errors.productId.message}</p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                {t('inventory.movements.quantity')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                min="0"
                placeholder="0"
                {...register('quantity', {
                  required: t('inventory.movements.quantityRequired'),
                  min: { value: 0.001, message: t('inventory.movements.quantityMin') },
                })}
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
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

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Link href="/dashboard/inventory/movements">
                <Button type="button" variant="outline">
                  {t('common.cancel')}
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('inventory.movements.create')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
