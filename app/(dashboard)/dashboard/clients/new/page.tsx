'use client';

import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { clientsApi } from '@/lib/api';
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
import { ArrowLeft, User, Building2, AlertCircle } from 'lucide-react';
import { ClientKind } from '@/types';

interface ClientFormData {
  kind: ClientKind;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  notes?: string;
}

export default function NewClientPage() {
  const { t } = useTranslation();
  const router = useRouter();

  // Fetch client types from tenant settings
  const { data: settingsData } = useTenantSettings('clients');
  const clientTypesSetting = settingsData?.find((s: any) => s.key === 'clients.types');
  const clientTypes = (clientTypesSetting?.value as Array<{ value: string; label: string }>) || [
    { value: 'INDIVIDUAL', label: 'Individual' },
    { value: 'COMPANY', label: 'Company' },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<ClientFormData>({
    defaultValues: {
      kind: clientTypes[0]?.value as ClientKind || 'INDIVIDUAL',
      name: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      toast.success(t('clients.clientCreated'));
      router.push('/dashboard/clients');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('clients.createError'));
    },
  });

  const onSubmit = (data: ClientFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('clients.addClient')}</h1>
          <p className="text-muted-foreground">{t('clients.addClientDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Main Form */}
          <div className="space-y-6">
            {/* Client Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('clients.clientDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client Type */}
                <div className="space-y-2">
                  <Label>{t('clients.kind')} <span className="text-destructive">*</span></Label>
                  <Controller
                    name="kind"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {clientTypes.slice(0, 2).map((type, index) => {
                            const valueKey = type.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
                            const translationKey = `settings.settingValues.clients.${valueKey}`;
                            const label = t(translationKey) !== translationKey ? t(translationKey) : type.label;
                            const isIndividual = index === 0;
                            const isSelected = field.value === type.value;
                            
                            return (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => field.onChange(type.value)}
                                className={`p-3 border-2 rounded-lg transition-all ${
                                  isSelected
                                    ? (isIndividual ? 'border-blue-500 bg-blue-500/5' : 'border-purple-500 bg-purple-500/5')
                                    : (isIndividual ? 'border-border hover:border-blue-500/50' : 'border-border hover:border-purple-500/50')
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isIndividual ? (
                                    <User className={`h-5 w-5 ${
                                      isSelected ? 'text-blue-600' : 'text-muted-foreground'
                                    }`} />
                                  ) : (
                                    <Building2 className={`h-5 w-5 ${
                                      isSelected ? 'text-purple-600' : 'text-muted-foreground'
                                    }`} />
                                  )}
                                  <p className="text-sm font-medium">{label}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {clientTypes.length > 2 && (
                          <div className="grid grid-cols-2 gap-3">
                            {clientTypes.slice(2).map((type) => {
                              const valueKey = type.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
                              const translationKey = `settings.settingValues.clients.${valueKey}`;
                              const label = t(translationKey) !== translationKey ? t(translationKey) : type.label;
                              
                              return (
                                <button
                                  key={type.value}
                                  type="button"
                                  onClick={() => field.onChange(type.value)}
                                  className={`p-3 border-2 rounded-lg transition-all ${
                                    field.value === type.value
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{label}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t('clients.name')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register('name', {
                      required: t('clients.nameRequired'),
                      minLength: { value: 2, message: t('clients.nameMinLength') },
                    })}
                    placeholder={t('clients.namePlaceholder')}
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
                    <Label htmlFor="email">{t('clients.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder={t('clients.emailPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('clients.phone')}</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder={t('clients.phonePlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t('clients.address')}</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder={t('clients.addressPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('clients.city')}</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder={t('clients.cityPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">{t('clients.postalCode')}</Label>
                    <Input
                      id="postalCode"
                      {...register('postalCode')}
                      placeholder={t('clients.postalCodePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">{t('clients.country')}</Label>
                    <Input
                      id="country"
                      {...register('country')}
                      placeholder={t('clients.countryPlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">{t('clients.taxId')}</Label>
                  <Input
                    id="taxId"
                    {...register('taxId')}
                    placeholder={t('clients.taxIdPlaceholder')}
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
                <CardTitle>{t('clients.additionalInformation')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('clients.notes')}</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder={t('clients.notesPlaceholder')}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="pt-4 space-y-3 border-t">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || createMutation.isPending}
                  >
                    {isSubmitting || createMutation.isPending
                      ? t('common.saving')
                      : t('clients.createClient')}
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
