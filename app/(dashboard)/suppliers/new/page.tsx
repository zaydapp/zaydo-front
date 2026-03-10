'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { suppliersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Package, Truck, Settings, Box, Ship } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import type { LucideIcon } from 'lucide-react';
import { TenantSetting } from '@/types';

const SUPPLIER_TYPE_ICONS: Record<string, LucideIcon> = {
  RAW_MATERIAL: Package,
  PACKAGING: Box,
  SERVICE: Settings,
  EQUIPMENT: Settings,
  LOGISTICS: Truck,
};

export default function NewSupplierPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch supplier types from tenant settings
  const { data: settingsData } = useTenantSettings('suppliers');
  const supplierTypesSetting = (settingsData as TenantSetting[] | undefined)?.find(
    (s) => s.key === 'suppliers.types'
  );
  const supplierTypes = (supplierTypesSetting?.value as Array<{
    value: string;
    label: string;
  }>) || [
    { value: 'RAW_MATERIAL', label: 'Raw Materials' },
    { value: 'PACKAGING', label: 'Packaging' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    type: supplierTypes[0]?.value || 'RAW_MATERIAL',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    contactPerson: '',
    taxId: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(t('suppliers.supplierCreated'));
      router.push('/dashboard/suppliers');
    },
    onError: () => {
      toast.error(t('suppliers.createError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('suppliers.addSupplier')}</h1>
          <p className="text-muted-foreground mt-1">{t('suppliers.addSupplierDescription')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier Type Selection */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <Label className="text-base font-semibold mb-4 block">
              {t('suppliers.selectType')}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {supplierTypes.map((type) => {
                const Icon = SUPPLIER_TYPE_ICONS[type.value] || Ship;
                const isSelected = formData.type === type.value;
                const valueKey = type.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const translationKey = `settings.settingValues.suppliers.${valueKey}`;
                const label = t(translationKey) !== translationKey ? t(translationKey) : type.label;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                    }`}
                  >
                    <div
                      className={`rounded-full p-3 ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium text-center ${
                        isSelected ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">{t('suppliers.basicInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t('suppliers.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder={t('suppliers.namePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">{t('suppliers.contactPerson')}</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder={t('suppliers.contactPersonPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('suppliers.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('suppliers.emailPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('suppliers.phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('suppliers.phonePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">{t('suppliers.taxId')}</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder={t('suppliers.taxIdPlaceholder')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">{t('suppliers.addressInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">{t('suppliers.address')}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('suppliers.addressPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">{t('suppliers.city')}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder={t('suppliers.cityPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">{t('suppliers.postalCode')}</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder={t('suppliers.postalCodePlaceholder')}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="country">{t('suppliers.country')}</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder={t('suppliers.countryPlaceholder')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">{t('suppliers.additionalInformation')}</h3>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('suppliers.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('suppliers.notesPlaceholder')}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? t('common.creating') : t('common.create')}
          </Button>
        </div>
      </form>
    </div>
  );
}
