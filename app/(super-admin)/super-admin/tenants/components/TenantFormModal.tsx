/*eslint-disable */
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TenantCreateInput, TenantDetails, TenantUpdateInput, ModuleDefinition } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, or hyphens'),
  contactEmail: z.string().email('Provide a valid email'),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  industry: z.string().optional(),
  website: z
    .string()
    .url('Provide a valid URL, e.g. https://example.com')
    .optional()
    .or(z.literal('')),
  status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  currency: z.string().length(3, 'Currency code must be 3 characters').optional(),
  moduleKeys: z.array(z.string()).optional(),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;

interface TenantFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TenantCreateInput | TenantUpdateInput, tenantId?: string) => Promise<void>;
  modules: ModuleDefinition[];
  initialTenant?: TenantDetails | null;
  isSubmitting?: boolean;
}

const TENANT_STATUSES: TenantFormValues['status'][] = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE'];

export function TenantFormModal({
  open,
  onOpenChange,
  onSubmit,
  modules,
  initialTenant,
  isSubmitting,
}: TenantFormModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      contactEmail: '',
      contactName: '',
      contactPhone: '',
      address: '',
      industry: '',
      website: '',
      status: 'TRIAL',
      currency: 'USD',
      moduleKeys: [],
    },
  });

  const baseModules = useMemo(() => modules.filter((module) => module.isBaseModule), [modules]);
  const addonModules = useMemo(() => modules.filter((module) => !module.isBaseModule), [modules]);
  const baseModuleKeys = useMemo(() => baseModules.map((module) => module.key), [baseModules]);

  const selectedModuleKeys = watch('moduleKeys') ?? [];
  const selectedAddonKeys = useMemo(
    () =>
      selectedModuleKeys.filter((key) => {
        const module = modules.find((m) => m.key === key);
        return module && !module.isBaseModule;
      }),
    [selectedModuleKeys, modules]
  );

  // Calculate MRR based on selected modules
  const calculatedMRR = useMemo(() => {
    return selectedModuleKeys.reduce((total, key) => {
      const module = modules.find((m) => m.key === key);
      const price =
        typeof module?.priceMonthly === 'number'
          ? module.priceMonthly
          : Number(module?.priceMonthly || 0);
      return total + price;
    }, 0);
  }, [selectedModuleKeys, modules]);

  useEffect(() => {
    if (initialTenant) {
      const moduleKeysFromTenant = (initialTenant.modules ?? [])
        .filter((module) => module.isEnabled)
        .map((module) => module.moduleKey);

      // Extract currency from tenant settings
      const currencySetting = initialTenant.settings?.find((s) => s.key === 'finance.currency');
      const currencyCode = (currencySetting?.value as any)?.code || 'USD';

      reset({
        name: initialTenant.companyName ?? '',
        slug: initialTenant.slug ?? '',
        contactEmail: initialTenant.contact?.email ?? '',
        contactName: initialTenant.contact?.name ?? '',
        contactPhone: initialTenant.contact?.phone ?? '',
        address: initialTenant.address ?? '',
        industry: initialTenant.industry ?? '',
        website: initialTenant.website ?? '',
        status: initialTenant.status ?? 'TRIAL',
        currency: currencyCode,
        moduleKeys: moduleKeysFromTenant ?? [],
      });
      return;
    }

    reset({
      name: '',
      slug: '',
      contactEmail: '',
      contactName: '',
      contactPhone: '',
      address: '',
      industry: '',
      website: '',
      status: 'TRIAL',
      currency: 'USD',
      moduleKeys: baseModuleKeys,
    });
  }, [initialTenant, reset, open, baseModuleKeys]);

  const handleBaseModuleToggle = useCallback(
    (moduleKey: string, checked: boolean) => {
      const currentKeys = selectedModuleKeys;
      const nextKeys = checked
        ? Array.from(new Set([...currentKeys, moduleKey]))
        : currentKeys.filter((key) => key !== moduleKey);
      setValue('moduleKeys', nextKeys, { shouldDirty: true });
    },
    [selectedModuleKeys, setValue]
  );

  const handleAddonToggle = useCallback(
    (moduleKey: string, checked: boolean) => {
      const currentKeys = selectedModuleKeys;
      const nextKeys = checked
        ? Array.from(new Set([...currentKeys, moduleKey]))
        : currentKeys.filter((key) => key !== moduleKey);
      setValue('moduleKeys', nextKeys, { shouldDirty: true });
    },
    [selectedModuleKeys, setValue]
  );

  const handleFormSubmit = async (values: TenantFormValues) => {
    const moduleKeys = values.moduleKeys ?? [];

    const basePayload = {
      name: values.name,
      slug: values.slug,
      contactEmail: values.contactEmail,
      contactName: values.contactName || undefined,
      contactPhone: values.contactPhone || undefined,
      address: values.address || undefined,
      industry: values.industry || undefined,
      website: values.website ? values.website : undefined,
      status: values.status,
      currency: values.currency,
      moduleKeys,
    };

    if (initialTenant) {
      const updatePayload: TenantUpdateInput = { ...basePayload };
      await onSubmit(updatePayload, initialTenant.id);
      return;
    }

    const createPayload: TenantCreateInput = basePayload;
    await onSubmit(createPayload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl! w-full max-h-[95vh] overflow-hidden p-0">
        <form
          onSubmit={handleSubmit(async (values) => {
            await handleFormSubmit(values);
          })}
          className="flex h-full max-h-[95vh] flex-col"
        >
          <DialogHeader className="px-6 pt-6 pb-4 text-left">
            <DialogTitle className="text-xl">
              {initialTenant ? 'Edit tenant' : 'Create tenant'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {initialTenant
                ? 'Update tenant account details, billing plan and optional add-ons.'
                : 'Onboard a new tenant with the Basic plan and optional add-ons.'}
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
            <section className="space-y-5">
              <div>
                <h3 className="text-base font-semibold">Tenant information</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Core profile and default workspace settings for the tenant.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="tenant-name">Name</Label>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <Input id="tenant-name" placeholder="Acme Technologies" {...field} />
                    )}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-slug">Slug</Label>
                  <Controller
                    control={control}
                    name="slug"
                    render={({ field }) => <Input id="tenant-slug" placeholder="acme" {...field} />}
                  />
                  {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-status">Status</Label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <div className="relative">
                        <select
                          id="tenant-status"
                          className={cn(
                            'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                          )}
                          {...field}
                        >
                          {TENANT_STATUSES.map((option) => (
                            <option key={option} value={option}>
                              {option?.charAt(0)}
                              {option?.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-currency">Currency</Label>
                  <Controller
                    control={control}
                    name="currency"
                    render={({ field }) => (
                      <div className="relative">
                        <select
                          id="tenant-currency"
                          className={cn(
                            'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                          )}
                          {...field}
                        >
                          <option value="USD">USD - US Dollar ($)</option>
                          <option value="EUR">EUR - Euro (€)</option>
                          <option value="GBP">GBP - British Pound (£)</option>
                          <option value="TND">TND - Tunisian Dinar (DT)</option>
                          <option value="MAD">MAD - Moroccan Dirham (DH)</option>
                          <option value="JPY">JPY - Japanese Yen (¥)</option>
                          <option value="CNY">CNY - Chinese Yuan (¥)</option>
                          <option value="CAD">CAD - Canadian Dollar ($)</option>
                          <option value="AUD">AUD - Australian Dollar ($)</option>
                          <option value="CHF">CHF - Swiss Franc (Fr)</option>
                        </select>
                      </div>
                    )}
                  />
                  {errors.currency && (
                    <p className="text-sm text-destructive">{errors.currency.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-contact-email">Contact email</Label>
                  <Controller
                    control={control}
                    name="contactEmail"
                    render={({ field }) => (
                      <Input
                        id="tenant-contact-email"
                        type="email"
                        placeholder="admin@acme.com"
                        {...field}
                      />
                    )}
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-contact-name">Contact name</Label>
                  <Controller
                    control={control}
                    name="contactName"
                    render={({ field }) => (
                      <Input id="tenant-contact-name" placeholder="Jane Cooper" {...field} />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-contact-phone">Contact phone</Label>
                  <Controller
                    control={control}
                    name="contactPhone"
                    render={({ field }) => (
                      <Input id="tenant-contact-phone" placeholder="+1 555-0100" {...field} />
                    )}
                  />
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tenant-address">Address</Label>
                  <Controller
                    control={control}
                    name="address"
                    render={({ field }) => (
                      <Textarea
                        id="tenant-address"
                        placeholder="123 Main Street"
                        rows={3}
                        {...field}
                      />
                    )}
                  />
                </div>
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="tenant-industry">Industry</Label>
                    <Controller
                      control={control}
                      name="industry"
                      render={({ field }) => (
                        <Input id="tenant-industry" placeholder="Manufacturing" {...field} />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-website">Website</Label>
                    <Controller
                      control={control}
                      name="website"
                      render={({ field }) => (
                        <Input id="tenant-website" placeholder="https://acme.com" {...field} />
                      )}
                    />
                    {errors.website && (
                      <p className="text-sm text-destructive">{errors.website.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-5">
              <div>
                <h3 className="text-base font-semibold">Modules & pricing</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure modules for this tenant. Base modules can be disabled if not needed.
                  Add-ons have additional monthly fees.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-4 rounded-lg border bg-muted/20 p-5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">Base modules</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Core features included. Can be disabled if not required.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs w-fit">
                      {baseModules.filter((m) => selectedModuleKeys.includes(m.key)).length} /{' '}
                      {baseModules.length} enabled
                    </Badge>
                  </div>
                  {baseModules.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {baseModules.map((baseModule) => {
                        const isChecked = selectedModuleKeys.includes(baseModule.key);
                        return (
                          <label
                            key={baseModule.id}
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors',
                              isChecked
                                ? 'border-primary/60 bg-primary/5'
                                : 'hover:border-border/80 opacity-60'
                            )}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(value) =>
                                handleBaseModuleToggle(baseModule.key, Boolean(value))
                              }
                            />
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium leading-none">
                                  {baseModule.name}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  Free
                                </Badge>
                              </div>
                              {baseModule.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {baseModule.description}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No base modules configured.</p>
                  )}
                </div>

                <div className="space-y-4 rounded-lg border bg-background p-5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">Add-on modules</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional features with additional monthly charges.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs w-fit">
                      {selectedAddonKeys.length} add-ons selected
                    </Badge>
                  </div>
                  {addonModules.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {addonModules.map((addonModule) => {
                        const isChecked = selectedModuleKeys.includes(addonModule.key);
                        return (
                          <label
                            key={addonModule.id}
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors',
                              isChecked
                                ? 'border-primary/60 bg-primary/5'
                                : 'hover:border-border/80'
                            )}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(value) =>
                                handleAddonToggle(addonModule.key, Boolean(value))
                              }
                            />
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium leading-none">
                                  {addonModule.name}
                                </p>
                                <Badge variant="default" className="text-xs">
                                  €{addonModule.priceMonthly}/mo
                                </Badge>
                              </div>
                              {addonModule.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {addonModule.description}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No add-on modules available.</p>
                  )}
                </div>

                {selectedModuleKeys.length > 0 && (
                  <div className="rounded-lg border bg-muted/10 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">Monthly recurring revenue</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Total based on selected modules
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">€{calculatedMRR.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">per month</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-medium">
                        Active modules ({selectedModuleKeys.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedModuleKeys.map((moduleKey) => {
                          const moduleDefinition = modules.find((item) => item.key === moduleKey);
                          return (
                            <Badge
                              key={moduleKey}
                              variant={moduleDefinition?.isBaseModule ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {moduleDefinition?.name ?? moduleKey}
                              {moduleDefinition &&
                                !moduleDefinition.isBaseModule &&
                                ` (€${moduleDefinition.priceMonthly})`}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <Separator />

          <DialogFooter className="flex items-center justify-end gap-3 border-0 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-32">
              {isSubmitting ? 'Saving...' : initialTenant ? 'Save changes' : 'Create tenant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
