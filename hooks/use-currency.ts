/*eslint-disable */
'use client';

import { useTenant } from '@/contexts/tenant-context';
import { formatCurrency, CurrencyFormatOptions } from '@/lib/utils';
import { useTenantSettings } from './useTenantSettings';

/**
 * Hook to format currency using tenant settings
 */
export function useCurrency() {
  const { tenant } = useTenant();
  const { data: settings } = useTenantSettings('finance');

  // Get currency settings from tenant settings
  const currencySetting = settings?.find((s: any) => s.key === 'finance.currency');
  const currencyOptions: Partial<CurrencyFormatOptions> = currencySetting?.value || {
    code: tenant?.settings?.currency || 'USD',
    symbol: '$',
    position: 'after',
    decimalSeparator: ',',
    thousandSeparator: ' ',
    decimals: 2,
  };

  /**
   * Format an amount using the tenant's currency settings
   */
  const format = (amount: number): string => {
    return formatCurrency(amount, currencyOptions);
  };

  return {
    currency: currencyOptions.code || 'USD',
    format,
    options: currencyOptions,
  };
}
