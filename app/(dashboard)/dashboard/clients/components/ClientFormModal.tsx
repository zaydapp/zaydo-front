'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { Client, ClientKind } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTenantSettings } from '@/hooks/useTenantSettings';

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
}

interface ClientFormData {
  kind?: ClientKind;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export function ClientFormModal({ open, onClose, client }: ClientFormModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClientFormData>();

  // Fetch client types from tenant settings
  const { data: settingsData } = useTenantSettings('clients');
  const clientTypesSetting = settingsData?.find(
    (s: { key: string; value: unknown }) => s.key === 'clients.types'
  );
  const clientTypes = (clientTypesSetting?.value as Array<{
    value: string;
    label: string;
  }>) || [
    { value: 'INDIVIDUAL', label: 'Individual' },
    { value: 'COMPANY', label: 'Company' },
  ];
  const defaultClientType = (clientTypes[0]?.value as ClientKind) || 'INDIVIDUAL';

  useEffect(() => {
    if (client) {
      reset({
        kind: client.kind,
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        postalCode: client.postalCode || '',
        country: client.country || '',
        taxId: client.taxId || '',
        notes: client.notes || '',
        status: client.status,
      });
    } else {
      reset({
        kind: defaultClientType,
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        taxId: '',
        notes: '',
        status: 'ACTIVE',
      });
    }
  }, [client, reset, defaultClientType]);

  const mutation = useMutation({
    mutationFn: (data: ClientFormData) =>
      client ? clientsApi.update(client.id, data) : clientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(client ? t('clients.clientUpdated') : t('clients.clientCreated'));
      onClose();
    },
    onError: () => {
      toast.error(t('common.error'));
    },
  });

  const onSubmit = (data: ClientFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client ? t('clients.editClient') : t('clients.addClient')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kind">{t('clients.kind')} *</Label>
              <Select
                onValueChange={(value) => setValue('kind', value as ClientKind)}
                defaultValue={client?.kind || defaultClientType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clientTypes.map((type) => {
                    const valueKey = type.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    const translationKey = `settings.settingValues.clients.${valueKey}`;
                    const label =
                      t(translationKey) !== translationKey ? t(translationKey) : type.label;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t('clients.name')} *</Label>
              <Input
                id="name"
                {...register('name', { required: true })}
                placeholder={t('clients.namePlaceholder')}
              />
              {errors.name && (
                <span className="text-sm text-destructive">{t('common.required')}</span>
              )}
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="city">{t('clients.city')}</Label>
              <Input id="city" {...register('city')} placeholder={t('clients.cityPlaceholder')} />
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
            <Label htmlFor="address">{t('clients.address')}</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder={t('clients.addressPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">{t('clients.taxId')}</Label>
            <Input id="taxId" {...register('taxId')} placeholder={t('clients.taxIdPlaceholder')} />
          </div>

          {client && (
            <div className="space-y-2">
              <Label htmlFor="status">{t('clients.status')}</Label>
              <Select
                onValueChange={(value) => setValue('status', value as 'ACTIVE' | 'INACTIVE')}
                defaultValue={client.status}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t('clients.active')}</SelectItem>
                  <SelectItem value="INACTIVE">{t('clients.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
