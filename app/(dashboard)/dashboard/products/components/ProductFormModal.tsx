'use client';

import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { Product } from '@/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Package2, Boxes, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

interface ProductFormData {
  name: string;
  type: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
  sku?: string;
  description?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  supplierId?: string;
  notes?: string;
}

const COMMON_UNITS = ['kg', 'L', 'unités', 'g', 'mL', 'pièces', 'cartons', 'palettes'];

export function ProductFormModal({ open, onClose, product }: ProductFormModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
    control,
  } = useForm<ProductFormData>({
    defaultValues: {
      type: 'RAW_MATERIAL',
      currentStock: 0,
      minStock: 0,
      name: '',
      sku: '',
      description: '',
      unit: '',
      supplierId: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        type: product.type,
        sku: product.sku || '',
        description: product.description || '',
        unit: product.unit,
        currentStock: Number(product.currentStock),
        minStock: Number(product.minStock),
        supplierId: product.supplierId || '',
        notes: product.notes || '',
      });
    } else {
      reset({
        type: 'RAW_MATERIAL',
        currentStock: 0,
        minStock: 0,
        name: '',
        sku: '',
        description: '',
        unit: '',
        supplierId: '',
        notes: '',
      });
    }
  }, [product, reset, open]);

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('products.productCreated'));
      reset();
      onClose();
    },
    onError: (error: Error) => {
      const apiError = error as Error & { response?: { data?: { message?: string } } };
      toast.error(apiError?.response?.data?.message || t('products.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('products.productUpdated'));
      reset();
      onClose();
    },
    onError: (error: Error) => {
      const apiError = error as Error & { response?: { data?: { message?: string } } };
      toast.error(apiError?.response?.data?.message || t('products.updateError'));
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (product?.id) {
      updateMutation.mutate({ id: product.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const productType = watch('type');
  const currentStock = watch('currentStock');
  const minStock = watch('minStock');

  const isLowStock = currentStock < minStock && minStock > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            {productType === 'RAW_MATERIAL' ? (
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Boxes className="h-6 w-6 text-orange-600" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Package2 className="h-6 w-6 text-blue-600" />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {product ? t('products.editProduct') : t('products.addProduct')}
              </DialogTitle>
              <DialogDescription>
                {product ? t('products.editDescription') : t('products.addDescription')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Type Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t('products.type')} <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="type"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => field.onChange('RAW_MATERIAL')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      field.value === 'RAW_MATERIAL'
                        ? 'border-orange-500 bg-orange-500/5'
                        : 'border-border hover:border-orange-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Boxes
                        className={`h-5 w-5 ${field.value === 'RAW_MATERIAL' ? 'text-orange-600' : 'text-muted-foreground'}`}
                      />
                      <div className="text-left">
                        <p className="font-medium">{t('products.rawMaterial')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('products.rawMaterialDesc')}
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange('FINISHED_PRODUCT')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      field.value === 'FINISHED_PRODUCT'
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-border hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Package2
                        className={`h-5 w-5 ${field.value === 'FINISHED_PRODUCT' ? 'text-blue-600' : 'text-muted-foreground'}`}
                      />
                      <div className="text-left">
                        <p className="font-medium">{t('products.finishedProduct')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('products.finishedProductDesc')}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            />
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">{t('products.basicInformation')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('products.name')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register('name', {
                    required: t('products.nameRequired'),
                    minLength: { value: 2, message: t('products.nameMinLength') },
                  })}
                  placeholder={t('products.namePlaceholder')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">{t('products.sku')}</Label>
                <Input id="sku" {...register('sku')} placeholder={t('products.skuPlaceholder')} />
                <p className="text-xs text-muted-foreground">{t('products.skuHelper')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('products.description')}</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder={t('products.descriptionPlaceholder')}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          {/* Stock Information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">{t('products.stockInformation')}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">
                  {t('products.unit')} <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="unit"
                  control={control}
                  rules={{ required: t('products.unitRequired') }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={errors.unit ? 'border-destructive' : ''}>
                        <SelectValue placeholder={t('products.selectUnit')} />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.unit && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.unit.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentStock">
                  {t('products.currentStock')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="currentStock"
                  type="number"
                  step="0.01"
                  {...register('currentStock', {
                    required: t('products.currentStockRequired'),
                    valueAsNumber: true,
                    min: { value: 0, message: t('products.minZero') },
                  })}
                  placeholder="0"
                  className={errors.currentStock ? 'border-destructive' : ''}
                />
                {errors.currentStock && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.currentStock.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">
                  {t('products.minStock')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="minStock"
                  type="number"
                  step="0.01"
                  {...register('minStock', {
                    required: t('products.minStockRequired'),
                    valueAsNumber: true,
                    min: { value: 0, message: t('products.minZero') },
                  })}
                  placeholder="0"
                  className={errors.minStock ? 'border-destructive' : ''}
                />
                {errors.minStock && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.minStock.message}
                  </p>
                )}
              </div>
            </div>

            {isLowStock && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {t('products.lowStockWarning')}
                </p>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">{t('products.additionalInformation')}</h3>

            <div className="space-y-2">
              <Label htmlFor="supplierId">{t('products.supplier')}</Label>
              <Input
                id="supplierId"
                {...register('supplierId')}
                placeholder={t('products.supplierPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">{t('products.supplierHelper')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('products.notes')}</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder={t('products.notesPlaceholder')}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <span className="text-destructive">*</span> {t('products.requiredFields')}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              >
                {isSubmitting || createMutation.isPending || updateMutation.isPending
                  ? t('common.saving')
                  : product
                    ? t('products.update')
                    : t('products.create')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
