'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModuleDefinition, SubscriptionPlan } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const planSchema = z.object({
  name: z.string().min(3, 'Plan name is required'),
  description: z.string().optional(),
  priceMonthly: z
    .number({ invalid_type_error: 'Monthly price must be a number' })
    .nonnegative('Monthly price must be positive'),
  priceYearly: z
    .number({ invalid_type_error: 'Yearly price must be a number' })
    .nonnegative('Yearly price must be positive'),
  currency: z.string().min(2, 'Currency code required'),
  maxUsers: z
    .number({ invalid_type_error: 'Max users must be a number' })
    .int('Max users must be an integer')
    .positive('Max users must be positive'),
  trialPeriodDays: z
    .number({ invalid_type_error: 'Trial days must be a number' })
    .int()
    .min(0)
    .max(90)
    .optional(),
  includedModuleKeys: z.array(z.string()).default([]),
});

export type PlanFormValues = z.infer<typeof planSchema>;

interface PlanFormProps {
  modules: ModuleDefinition[];
  defaultValues?: SubscriptionPlan;
  onSubmit: (values: PlanFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PlanForm({ modules, defaultValues, onSubmit, onCancel, isSubmitting }: PlanFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          description: defaultValues.description ?? '',
          priceMonthly: defaultValues.priceMonthly,
          priceYearly: defaultValues.priceYearly,
          currency: defaultValues.currency,
          maxUsers: defaultValues.maxUsers,
          trialPeriodDays: defaultValues.trialPeriodDays,
          includedModuleKeys: defaultValues.includedModuleKeys,
        }
      : {
          name: '',
          description: '',
          priceMonthly: 0,
          priceYearly: 0,
          currency: 'USD',
          maxUsers: 10,
          trialPeriodDays: 14,
          includedModuleKeys: [],
        },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        name: defaultValues.name,
        description: defaultValues.description ?? '',
        priceMonthly: defaultValues.priceMonthly,
        priceYearly: defaultValues.priceYearly,
        currency: defaultValues.currency,
        maxUsers: defaultValues.maxUsers,
        trialPeriodDays: defaultValues.trialPeriodDays,
        includedModuleKeys: defaultValues.includedModuleKeys,
      });
    }
  }, [defaultValues, reset]);

  const includedModuleKeys = watch('includedModuleKeys');

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      className="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="plan-name">Plan name</Label>
          <Input id="plan-name" {...register('name')} placeholder="Professional" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan-currency">Currency</Label>
          <Input id="plan-currency" {...register('currency')} placeholder="USD" maxLength={3} />
          {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan-price-monthly">Monthly price</Label>
          <Input
            id="plan-price-monthly"
            type="number"
            step="0.01"
            {...register('priceMonthly', { valueAsNumber: true })}
          />
          {errors.priceMonthly && <p className="text-sm text-destructive">{errors.priceMonthly.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan-price-yearly">Yearly price</Label>
          <Input id="plan-price-yearly" type="number" step="0.01" {...register('priceYearly', { valueAsNumber: true })} />
          {errors.priceYearly && <p className="text-sm text-destructive">{errors.priceYearly.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan-max-users">Max users</Label>
          <Input id="plan-max-users" type="number" {...register('maxUsers', { valueAsNumber: true })} />
          {errors.maxUsers && <p className="text-sm text-destructive">{errors.maxUsers.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan-trial">Trial period (days)</Label>
          <Input id="plan-trial" type="number" {...register('trialPeriodDays', { valueAsNumber: true })} />
          {errors.trialPeriodDays && <p className="text-sm text-destructive">{errors.trialPeriodDays.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan-description">Description</Label>
        <Textarea
          id="plan-description"
          rows={3}
          {...register('description')}
          placeholder="Ideal for growing teams needing full automation."
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <Label>Included modules</Label>
          <p className="text-xs text-muted-foreground">
            Select modules that are bundled with this plan. Tenants can purchase additional modules separately.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {modules.map((module) => {
            const checked = includedModuleKeys?.includes(module.key) ?? false;
            return (
              <label key={module.id} className="flex items-start gap-2 rounded-md border p-3">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(isChecked) => {
                    setValue(
                      'includedModuleKeys',
                      isChecked
                        ? [...new Set([...(includedModuleKeys ?? []), module.key])]
                        : (includedModuleKeys ?? []).filter((key) => key !== module.key)
                    );
                  }}
                />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{module.name}</p>
                  <p className="text-xs text-muted-foreground">{module.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : defaultValues ? 'Update plan' : 'Create plan'}
        </Button>
      </div>
    </form>
  );
}


