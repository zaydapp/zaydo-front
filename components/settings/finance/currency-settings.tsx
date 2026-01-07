'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantSettings, useUpdateSetting } from '@/hooks/useTenantSettings';
import { useTenant } from '@/contexts/tenant-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface CurrencySettings {
  code: string;
  symbol: string;
  position: 'before' | 'after';
  decimalSeparator: string;
  thousandSeparator: string;
  decimals: number;
}

export function CurrencySettings() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useTenantSettings('finance');
  const updateSetting = useUpdateSetting();
  const { refreshTenant, tenant } = useTenant();

  const currencySetting = settings?.find((s: any) => s.key === 'finance.currency');
  const initialValue: CurrencySettings = currencySetting?.value || {
    code: tenant?.settings?.currency || 'USD',
    symbol: '$',
    position: 'after',
    decimalSeparator: ',',
    thousandSeparator: ' ',
    decimals: 2,
  };

  const [formData, setFormData] = useState<CurrencySettings>(initialValue);

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'finance.currency',
        data: { value: formData },
      });
      // Refresh tenant context so tenant.settings is updated application-wide
      try {
        await refreshTenant();
      } catch (err) {
        // ignore refresh errors but keep going
        console.warn('Failed to refresh tenant after currency update', err);
      }
      toast.success(t('settings.currencyUpdated') || 'Currency settings updated successfully');
    } catch (error) {
      toast.error(t('settings.updateError') || 'Failed to update currency settings');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  const exampleNumber = 1234567.89;
  const formatted = new Intl.NumberFormat('en', {
    minimumFractionDigits: formData.decimals,
    maximumFractionDigits: formData.decimals,
  }).format(exampleNumber)
    .replace(/,/g, '###THOUSAND###')
    .replace(/\./g, formData.decimalSeparator)
    .replace(/###THOUSAND###/g, formData.thousandSeparator);

  const displayAmount = formData.position === 'before' 
    ? `${formData.symbol}${formatted}` 
    : `${formatted}${formData.symbol}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.finance.currencySettings') || 'Currency & Formatting'}</CardTitle>
        <CardDescription>
          {t('settings.finance.currencyDescription') || 'Configure how monetary values are displayed'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="code">{t('settings.finance.currencyCode') || 'Currency Code'}</Label>
            <Input
              id="code"
              value={formData.code}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.finance.currencyCodeManaged') || 'Currency code is managed by your system administrator'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">{t('settings.finance.currencySymbol') || 'Currency Symbol'}</Label>
            <Input
              id="symbol"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              placeholder={t('settings.finance.currencySymbolPlaceholder') || '€'}
              maxLength={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">{t('settings.finance.symbolPosition') || 'Symbol Position'}</Label>
            <Select value={formData.position} onValueChange={(value: 'before' | 'after') => setFormData({ ...formData, position: value })}>
              <SelectTrigger id="position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before">{t('settings.finance.before') || 'Before amount ($100)'}</SelectItem>
                <SelectItem value="after">{t('settings.finance.after') || 'After amount (100€)'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="decimals">{t('settings.finance.decimals') || 'Decimal Places'}</Label>
            <Select value={formData.decimals.toString()} onValueChange={(value) => setFormData({ ...formData, decimals: parseInt(value) })}>
              <SelectTrigger id="decimals">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="decimalSeparator">{t('settings.finance.decimalSeparator') || 'Decimal Separator'}</Label>
            <Select value={formData.decimalSeparator} onValueChange={(value) => setFormData({ ...formData, decimalSeparator: value })}>
              <SelectTrigger id="decimalSeparator">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=".">{t('settings.finance.dotLabel') || '. (dot)'}</SelectItem>
                <SelectItem value=",">{t('settings.finance.commaLabel') || ', (comma)'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thousandSeparator">{t('settings.finance.thousandSeparator') || 'Thousand Separator'}</Label>
            <Select value={formData.thousandSeparator || 'none'} onValueChange={(value) => setFormData({ ...formData, thousandSeparator: value === 'none' ? '' : value })}>
              <SelectTrigger id="thousandSeparator">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=",">{t('settings.finance.commaLabel') || ', (comma)'}</SelectItem>
                <SelectItem value=".">{t('settings.finance.dotLabel') || '. (dot)'}</SelectItem>
                <SelectItem value=" ">{t('settings.finance.spaceLabel') || '(space)'}</SelectItem>
                <SelectItem value="none">{t('settings.finance.none') || 'None'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <Label className="text-sm text-muted-foreground mb-2 block">
            {t('settings.finance.preview') || 'Preview'}
          </Label>
          <div className="text-2xl font-semibold">
            {displayAmount}
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateSetting.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {t('common.save') || 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}
