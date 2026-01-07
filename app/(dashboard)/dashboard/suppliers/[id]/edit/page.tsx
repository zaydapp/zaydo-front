'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { suppliersApi } from '@/lib/api';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, AlertCircle, Loader2, Package, Box, Settings, Truck, Ship } from 'lucide-react';

const SUPPLIER_TYPE_ICONS: Record<string, any> = {
  RAW_MATERIAL: Package,
  PACKAGING: Box,
  SERVICE: Settings,
  EQUIPMENT: Settings,
  LOGISTICS: Truck,
};

interface SupplierFormData {
  name: string;
  type: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  contactPerson?: string;
  taxId?: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export default function EditSupplierPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const supplierId = params.id as string;

  // Fetch supplier types from tenant settings
  const { data: settingsData } = useTenantSettings('suppliers');
  const supplierTypesSetting = settingsData?.find((s: any) => s.key === 'suppliers.types');
  const supplierTypes = (supplierTypesSetting?.value as Array<{ value: string; label: string }>) || [
    { value: 'RAW_MATERIAL', label: 'Raw Materials' },
    { value: 'PACKAGING', label: 'Packaging' },
  ];

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => suppliersApi.getById(supplierId),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    reset,
  } = useForm<SupplierFormData>({
    defaultValues: {
      type: supplierTypes[0]?.value || 'RAW_MATERIAL',
      name: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        type: supplier.type,
        name: supplier.name,
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        postalCode: supplier.postalCode || '',
        country: supplier.country || '',
        contactPerson: supplier.contactPerson || '',
        taxId: supplier.taxId || '',
        notes: supplier.notes || '',
        status: supplier.status,
      });
    }
  }, [supplier, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: SupplierFormData) => suppliersApi.update(supplierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
      toast.success(t('suppliers.supplierUpdated'));
      router.push('/dashboard/suppliers');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('suppliers.updateError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => suppliersApi.delete(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(t('suppliers.supplierDeleted'));
      router.push('/dashboard/suppliers');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('suppliers.deleteError'));
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm(t('suppliers.confirmDelete'))) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t('suppliers.notFound')}</p>
        <Button onClick={() => router.push('/dashboard/suppliers')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('suppliers.editSupplier')}</h1>
            <p className="text-muted-foreground">{t('suppliers.editSupplierDescription')}</p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
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
            {/* Supplier Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('suppliers.supplierDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Supplier Type */}
                <div className="space-y-2">
                  <Label>{t('suppliers.type')} <span className="text-destructive">*</span></Label>
                  <Controller
                    name="type"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-3">
                        {supplierTypes.map((type) => {
                          const Icon = SUPPLIER_TYPE_ICONS[type.value] || Ship;
                          const valueKey = type.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
                          const translationKey = `settings.settingValues.suppliers.${valueKey}`;
                          const label = t(translationKey) !== translationKey ? t(translationKey) : type.label;
                          const isSelected = field.value === type.value;
                          
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => field.onChange(type.value)}
                              className={`p-3 border-2 rounded-lg transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className={`h-5 w-5 ${
                                  isSelected ? 'text-primary' : 'text-muted-foreground'
                                }`} />
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
                    {t('suppliers.name')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register('name', {
                      required: t('suppliers.nameRequired'),
                      minLength: { value: 2, message: t('suppliers.nameMinLength') },
                    })}
                    placeholder={t('suppliers.namePlaceholder')}
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
                  <Label htmlFor="contactPerson">{t('suppliers.contactPerson')}</Label>
                  <Input
                    id="contactPerson"
                    {...register('contactPerson')}
                    placeholder={t('suppliers.contactPersonPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('suppliers.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder={t('suppliers.emailPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('suppliers.phone')}</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder={t('suppliers.phonePlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t('suppliers.address')}</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder={t('suppliers.addressPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('suppliers.city')}</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder={t('suppliers.cityPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">{t('suppliers.postalCode')}</Label>
                    <Input
                      id="postalCode"
                      {...register('postalCode')}
                      placeholder={t('suppliers.postalCodePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">{t('suppliers.country')}</Label>
                    <Input
                      id="country"
                      {...register('country')}
                      placeholder={t('suppliers.countryPlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">{t('suppliers.taxId')}</Label>
                  <Input
                    id="taxId"
                    {...register('taxId')}
                    placeholder={t('suppliers.taxIdPlaceholder')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Additional Info & Actions */}
          <div className="space-y-6">
            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('suppliers.additionalInformation')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">{t('suppliers.status')}</Label>
                  <Controller
                    name="status"
                    control={control}
                    defaultValue="ACTIVE"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('suppliers.selectStatus')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">{t('suppliers.active')}</SelectItem>
                          <SelectItem value="INACTIVE">{t('suppliers.inactive')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('suppliers.notes')}</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder={t('suppliers.notesPlaceholder')}
                    rows={4}
                    className="resize-none"
                  />
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
                      t('suppliers.updateSupplier')
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
                    <span className="text-destructive">*</span> {t('common.requiredFields')}
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
