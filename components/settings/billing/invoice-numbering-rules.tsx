/*eslint-disable*/
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  useInvoiceNumberingConfig,
  useUpdateInvoiceNumberingConfig,
} from '@/hooks/useInvoiceNumbering';
import {
  INVOICE_NUMBERING_TOKENS,
  computeInvoiceNumberPreview,
  describeResetFrequency,
} from '@/lib/invoice-numbering';
import { InvoiceNumberingConfig, InvoiceNumberingResetFrequency, UserRole } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Save, ShieldAlert, Eye, RefreshCw } from 'lucide-react';

type FormState = Pick<
  InvoiceNumberingConfig,
  | 'prefixTemplate'
  | 'formatTemplate'
  | 'sequenceLength'
  | 'resetFrequency'
  | 'allowManualOverride'
  | 'nextSequence'
>;

const resetOptions: { value: InvoiceNumberingResetFrequency; label: string }[] = [
  { value: 'NEVER', label: 'Never' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

const DEFAULT_FORM: FormState = {
  prefixTemplate: 'INV-{YYYY}',
  formatTemplate: '{PREFIX}-{YYYY}-{SEQ}',
  sequenceLength: 3,
  resetFrequency: 'YEARLY',
  allowManualOverride: false,
  nextSequence: 1,
};

const buildFormState = (config?: InvoiceNumberingConfig | null): FormState => ({
  prefixTemplate: config?.prefixTemplate ?? DEFAULT_FORM.prefixTemplate,
  formatTemplate: config?.formatTemplate ?? DEFAULT_FORM.formatTemplate,
  sequenceLength: config?.sequenceLength ?? DEFAULT_FORM.sequenceLength,
  resetFrequency: config?.resetFrequency ?? DEFAULT_FORM.resetFrequency,
  allowManualOverride: config?.allowManualOverride ?? DEFAULT_FORM.allowManualOverride,
  nextSequence: config?.nextSequence ?? DEFAULT_FORM.nextSequence,
});

export function InvoiceNumberingRules({ showHeader = false }: { showHeader?: boolean }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canOverrideSequence = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
  const { data, isLoading } = useInvoiceNumberingConfig();
  const updateConfig = useUpdateInvoiceNumberingConfig();

  const [formState, setFormState] = useState<FormState>(buildFormState(data));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) {
      setFormState(buildFormState(data));
      setDirty(false);
    }
  }, [data]);

  const validation = useMemo(() => {
    return computeInvoiceNumberPreview({
      ...formState,
      nextSequence: formState.nextSequence,
    });
  }, [formState]);

  const hasErrors = validation.errors.length > 0;

  const handleInputChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (hasErrors) {
      toast.error(
        t('settings.billing.validationError') || 'Please resolve validation errors before saving.'
      );
      return;
    }

    try {
      await updateConfig.mutateAsync({
        prefixTemplate: formState.prefixTemplate.trim(),
        formatTemplate: formState.formatTemplate.trim(),
        resetFrequency: formState.resetFrequency,
        sequenceLength: formState.sequenceLength,
        allowManualOverride: formState.allowManualOverride,
        nextSequence: formState.nextSequence,
      });
      toast.success(
        t('settings.billing.numberingUpdated') || 'Invoice numbering rules updated successfully'
      );
      setDirty(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || t('settings.updateError') || 'Failed to update settings';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          {t('common.loading') || 'Loading...'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('settings.billing.invoiceNumbering') || 'Invoice Numbering Rules'}
          </h1>
          <p className="text-muted-foreground">
            {t('settings.billing.invoiceNumberingDescription') ||
              'Configure how invoice numbers are generated'}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.billing.prefixConfiguration') || 'Numbering Template'}</CardTitle>
          <CardDescription>
            {t('settings.billing.formatDescription') ||
              'Define the prefix, template, and sequence formatting for generated invoice numbers.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('settings.billing.prefix') || 'Prefix Template'}</Label>
              <Input
                value={formState.prefixTemplate}
                onChange={(e) => handleInputChange('prefixTemplate', e.target.value)}
                placeholder="INV-{YYYY}"
                maxLength={24}
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.billing.prefixHelp') ||
                  'You can combine static text with {YYYY} or {MM} placeholders.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t('settings.billing.sequenceLength') || 'Sequence Length'}</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={formState.sequenceLength}
                onChange={(e) => handleInputChange('sequenceLength', Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.billing.sequenceLengthHelp') ||
                  'Determines how many digits are padded in {SEQ}.'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('settings.billing.formatOptions') || 'Format Template'}</Label>
            <Textarea
              value={formState.formatTemplate}
              onChange={(e) => handleInputChange('formatTemplate', e.target.value)}
              placeholder="{PREFIX}-{YYYY}-{SEQ}"
              rows={2}
            />
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {INVOICE_NUMBERING_TOKENS.map((token) => (
                <Badge key={token.token} variant="secondary">
                  {token.token}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('settings.billing.previewInfo') ||
                'Use the placeholders above to build your invoice number. {SEQ} is required.'}
            </p>
          </div>

          <Separator />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('settings.billing.resetFrequency') || 'Reset Frequency'}</Label>
              <Select
                value={formState.resetFrequency}
                onValueChange={(value: InvoiceNumberingResetFrequency) =>
                  handleInputChange('resetFrequency', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resetOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {describeResetFrequency(formState.resetFrequency)}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                {t('settings.billing.manualOverride') || 'Manual Override'}
                {!canOverrideSequence && (
                  <Badge variant="outline">
                    {t('settings.billing.restricted') || 'Restricted'}
                  </Badge>
                )}
              </Label>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {t('settings.billing.allowOverride') || 'Allow manual override in invoice form'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.billing.manualOverrideDescription') ||
                      'Let authorized users define the next invoice number in emergencies.'}
                  </p>
                </div>
                <Switch
                  checked={formState.allowManualOverride}
                  onCheckedChange={(checked) => handleInputChange('allowManualOverride', checked)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('settings.billing.currentCounter') || 'Next Sequence Number'}</Label>
            <div className="flex gap-3">
              <Input
                type="number"
                min={0}
                value={formState.nextSequence}
                onChange={(e) => handleInputChange('nextSequence', Number(e.target.value))}
                disabled={!canOverrideSequence}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!canOverrideSequence}
                onClick={() => {
                  setFormState((prev) => ({ ...prev, nextSequence: 0 }));
                  setDirty(true);
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('settings.billing.resetToZero') || 'Reset'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('settings.billing.currentCounterHelp') ||
                'Used when manual override is triggered. Applies to the next generated invoice.'}
            </p>
            {!canOverrideSequence && (
              <Alert variant="default" className="mt-2 border-dashed">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>{t('settings.billing.restricted') || 'Restricted'}</AlertTitle>
                <AlertDescription>
                  {t('settings.billing.overridePermission') ||
                    'Only administrators can adjust the counter manually. Contact your admin team if you need help.'}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {(validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="space-y-3">
              {validation.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>{t('common.errors') || 'Errors detected'}</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 text-sm">
                      {validation.errors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              {validation.warnings.length > 0 && (
                <Alert>
                  <AlertTitle>{t('common.warnings') || 'Warnings'}</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 text-sm">
                      {validation.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={!dirty}
              onClick={() => {
                setFormState(buildFormState(data));
                setDirty(false);
              }}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={!dirty || updateConfig.isPending}>
              {updateConfig.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving') || 'Saving'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.save') || 'Save changes'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t('settings.billing.nextInvoicePreview') || 'Preview Next Invoice Number'}
            </CardTitle>
            <CardDescription>
              {t('settings.billing.nextInvoiceWillBe') || 'Next invoice will be numbered:'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/40 px-4 py-6 text-center text-2xl font-semibold">
              {validation.value || '---'}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-between">
              <span>
                {t('settings.billing.sequenceLength') || 'Sequence length'}:{' '}
                {formState.sequenceLength} · {t('settings.billing.resetFrequency') || 'Reset'}:{' '}
                {resetOptions.find((o) => o.value === formState.resetFrequency)?.label}
              </span>
              {data?.updatedAt && (
                <span>
                  {t('common.updated') || 'Updated'}{' '}
                  {formatDistanceToNow(new Date(data.updatedAt), { addSuffix: true })}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.billing.previewInfo') || 'Format reference'}</CardTitle>
            <CardDescription>
              {t('settings.billing.formatDescription') ||
                'Tokens you can combine to create compliant invoice numbers.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {INVOICE_NUMBERING_TOKENS.map((token) => (
              <div key={token.token} className="rounded-lg border p-3">
                <p className="text-sm font-semibold">{token.token}</p>
                <p className="text-xs text-muted-foreground">{token.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
