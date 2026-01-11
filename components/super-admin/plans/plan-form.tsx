'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModuleDefinition } from '@/types';
import { SubscriptionPlan } from '@/lib/api/super-admin';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const planSchema = z.object({
  name: z.string().min(3, 'Plan name is required'),
  description: z.string().optional(),
  price: z.number({ message: 'Price must be a number' }).nonnegative('Price must be positive'),
  currency: z.string().min(2, 'Currency code required'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
  maxUsers: z
    .number({ message: 'Max users must be a number' })
    .int('Max users must be an integer')
    .positive('Max users must be positive')
    .nullable()
    .optional(),
  isActive: z.boolean(),
  features: z.array(z.string()),
});

export type PlanFormValues = z.infer<typeof planSchema>;

interface PlanFormProps {
  modules: ModuleDefinition[];
  defaultValues?: SubscriptionPlan;
  onSubmit: (values: PlanFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PlanForm({
  modules,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: PlanFormProps) {
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
          price: defaultValues.price,
          currency: defaultValues.currency,
          billingCycle: defaultValues.billingCycle,
          maxUsers: defaultValues.maxUsers ?? null,
          isActive: defaultValues.isActive,
          features: defaultValues.features,
        }
      : {
          name: '',
          description: '',
          price: 0,
          currency: 'USD',
          billingCycle: 'MONTHLY' as const,
          maxUsers: 10,
          isActive: true,
          features: [],
        },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        name: defaultValues.name,
        description: defaultValues.description ?? '',
        price: defaultValues.price,
        currency: defaultValues.currency,
        billingCycle: defaultValues.billingCycle,
        maxUsers: defaultValues.maxUsers ?? null,
        isActive: defaultValues.isActive,
        features: defaultValues.features,
      });
    }
  }, [defaultValues, reset]);

  const features = watch('features');

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
          <Label htmlFor="plan-billing-cycle">Billing cycle</Label>
          <Select
            defaultValue={defaultValues?.billingCycle ?? 'MONTHLY'}
            onValueChange={(value) => setValue('billingCycle', value as 'MONTHLY' | 'YEARLY')}
          >
            <SelectTrigger id="plan-billing-cycle">
              <SelectValue placeholder="Select billing cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.billingCycle && (
            <p className="text-sm text-destructive">{errors.billingCycle.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan-price">Price</Label>
          <Input
            id="plan-price"
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
          />
          {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan-max-users">Max users (optional)</Label>
          <Input
            id="plan-max-users"
            type="number"
            {...register('maxUsers', {
              valueAsNumber: true,
              setValueAs: (v) => (v === '' ? null : Number(v)),
            })}
          />
          {errors.maxUsers && <p className="text-sm text-destructive">{errors.maxUsers.message}</p>}
        </div>
        <div className="space-y-2 flex items-center pt-8">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked === true)}
            />
            <span className="text-sm font-medium">Active</span>
          </label>
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
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <Label>Features (module keys)</Label>
          <p className="text-xs text-muted-foreground">
            Select modules that are bundled with this plan. Tenants can purchase additional modules
            separately.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {modules.map((module) => {
            const checked = features?.includes(module.key) ?? false;
            return (
              <label key={module.id} className="flex items-start gap-2 rounded-md border p-3">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(isChecked) => {
                    setValue(
                      'features',
                      isChecked
                        ? [...new Set([...(features ?? []), module.key])]
                        : (features ?? []).filter((key) => key !== module.key)
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
