'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { productsApi } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTenantSettings } from '@/hooks/useTenantSettings';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Package2,
  Boxes,
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductFormData {
  name: string;
  type: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
  sku?: string;
  description?: string;
  unit: string;
  minStock: number;
  supplierId?: string;
  notes?: string;
}

export default function EditProductPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const productId = params.id as string;

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch product types and units from tenant settings
  const { data: productsSettings } = useTenantSettings('products');
  const { data: unitsSettings } = useTenantSettings('units');

  const productTypesSetting = productsSettings?.find((s) => s.key === 'products.types');
  const productTypes = (productTypesSetting?.value as Array<{ value: string; label: string }>) || [
    { value: 'RAW_MATERIAL', label: 'Raw Material' },
    { value: 'FINISHED_PRODUCT', label: 'Finished Product' },
  ];

  // Collect all unit types
  const quantityUnits =
    (unitsSettings?.find((s) => s.key === 'units.quantity')?.value as string[]) || [];
  const weightUnits =
    (unitsSettings?.find((s) => s.key === 'units.weight')?.value as string[]) || [];
  const volumeUnits =
    (unitsSettings?.find((s) => s.key === 'units.volume')?.value as string[]) || [];
  const allUnits = [...new Set([...quantityUnits, ...weightUnits, ...volumeUnits])];
  const COMMON_UNITS = allUnits.length > 0 ? allUnits : ['kg', 'L', 'unités', 'g', 'mL', 'pièces'];

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    control,
    reset,
  } = useForm<ProductFormData>({
    defaultValues: {
      type: 'RAW_MATERIAL',
      minStock: 0,
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
        minStock: Number(product.minStock),
        supplierId: product.supplierId || '',
        notes: product.notes || '',
      });

      // Load existing images
      if (product.images && product.images.length > 0) {
        setExistingImages(product.images);
        setMainImageIndex(product.mainImageIndex || 0);
      }
    }
  }, [product, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: ProductFormData) => productsApi.update(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success(t('products.productUpdated'));
      router.push('/dashboard/products');
    },
    onError: (error: unknown) => {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || t('products.updateError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.delete(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('products.productDeleted'));
      router.push('/dashboard/products');
    },
    onError: (error: unknown) => {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || t('products.deleteError'));
    },
  });

  const onSubmit = (data: ProductFormData) => {
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm(t('products.confirmDelete'))) {
      deleteMutation.mutate();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const addImages = (files: File[]) => {
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(t('products.invalidImageType'));
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('products.imageTooLarge'));
        return false;
      }
      return true;
    });

    setImages((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));

      // Adjust mainImageIndex
      if (index === mainImageIndex) {
        setMainImageIndex(0);
      } else if (index < mainImageIndex) {
        setMainImageIndex((prev) => Math.max(0, prev - 1));
      }
    } else {
      const adjustedIndex = index - existingImages.length;
      setImages((prev) => prev.filter((_, i) => i !== adjustedIndex));
      setImagePreviews((prev) => prev.filter((_, i) => i !== adjustedIndex));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };

  const productType = watch('type');
  const minStock = watch('minStock');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t('products.notFound')}</p>
        <Button onClick={() => router.push('/dashboard/products')}>{t('common.back')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('products.editProduct')}</h1>
            <p className="text-muted-foreground">{t('products.editProductDescription')}</p>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('common.deleting')}
            </>
          ) : (
            t('common.delete')
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Main Form */}
          <div className="space-y-6">
            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('products.productDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Type */}
                <div className="space-y-2">
                  <Label>
                    {t('products.productType')} <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="type"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-3">
                        {productTypes.map((type, index) => {
                          const valueKey = type.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
                          const translationKey = `settings.settingValues.products.${valueKey}`;
                          const label =
                            t(translationKey) !== translationKey ? t(translationKey) : type.label;
                          const isRaw = index === 0;
                          const colorClass = isRaw ? 'orange' : 'blue';

                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => field.onChange(type.value)}
                              className={`p-3 border-2 rounded-lg transition-all ${
                                field.value === type.value
                                  ? `border-${colorClass}-500 bg-${colorClass}-500/5`
                                  : `border-border hover:border-${colorClass}-500/50`
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isRaw ? (
                                  <Boxes
                                    className={`h-5 w-5 ${field.value === type.value ? `text-${colorClass}-600` : 'text-muted-foreground'}`}
                                  />
                                ) : (
                                  <Package2
                                    className={`h-5 w-5 ${field.value === type.value ? `text-${colorClass}-600` : 'text-muted-foreground'}`}
                                  />
                                )}
                                <p className="text-sm font-medium">{label}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">{t('products.sku')}</Label>
                    <Input
                      id="sku"
                      {...register('sku')}
                      placeholder={t('products.skuPlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground">{t('products.skuHelper')}</p>
                  </div>

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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplierId">{t('products.supplier')}</Label>
                    <Input
                      id="supplierId"
                      {...register('supplierId')}
                      placeholder={t('products.supplierPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('products.notes')}</Label>
                    <Input
                      id="notes"
                      {...register('notes')}
                      placeholder={t('products.notesPlaceholder')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle>{t('products.productImages')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">{t('products.dragDropImages')}</p>
                      <p className="text-xs text-muted-foreground">{t('products.imageFormats')}</p>
                    </div>
                    <input
                      type="file"
                      id="images"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <label htmlFor="images" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        {t('products.selectImages')}
                      </label>
                    </Button>
                  </div>
                </div>

                {(existingImages.length > 0 || imagePreviews.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t('products.clickToSetMain')}</p>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Existing images from database */}
                      {existingImages.map((imageUrl, index) => (
                        <div
                          key={`existing-${index}`}
                          className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                            index === mainImageIndex
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-transparent hover:border-primary/50'
                          }`}
                          onClick={() => setMainImageIndex(index)}
                        >
                          <img
                            src={imageUrl}
                            alt={`Existing ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index, true);
                            }}
                            className="absolute top-2 right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {index === mainImageIndex && (
                            <Badge className="absolute bottom-2 left-2 text-xs">
                              {t('products.mainImage')}
                            </Badge>
                          )}
                        </div>
                      ))}

                      {/* New images to be uploaded */}
                      {imagePreviews.map((preview, index) => {
                        const absoluteIndex = existingImages.length + index;
                        return (
                          <div
                            key={`new-${index}`}
                            className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                              absoluteIndex === mainImageIndex
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-transparent hover:border-primary/50'
                            }`}
                            onClick={() => setMainImageIndex(absoluteIndex)}
                          >
                            <img
                              src={preview}
                              alt={`New ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(absoluteIndex, false);
                              }}
                              className="absolute top-2 right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            {absoluteIndex === mainImageIndex && (
                              <Badge className="absolute bottom-2 left-2 text-xs">
                                {t('products.mainImage')}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                              New
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stock & Actions */}
          <div className="space-y-6">
            {/* Stock & Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t('products.stockInformation')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <p className="text-xs text-muted-foreground">{t('products.minStockHelper')}</p>
                </div>

                <div className="pt-4 space-y-3 border-t">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || updateMutation.isPending}
                  >
                    {isSubmitting || updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.saving')}
                      </>
                    ) : (
                      t('products.updateProduct')
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                  >
                    {t('common.cancel')}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    <span className="text-destructive">*</span> {t('products.requiredFields')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
