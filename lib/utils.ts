import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CurrencyFormatOptions {
  code: string;
  symbol: string;
  position: 'before' | 'after';
  decimalSeparator: string;
  thousandSeparator: string;
  decimals: number;
}

/**
 * Format a number as currency using custom settings
 * @param amount - The numeric amount to format
 * @param options - Currency formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, options?: Partial<CurrencyFormatOptions>): string {
  const defaults: CurrencyFormatOptions = {
    code: 'USD',
    symbol: '$',
    position: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimals: 2,
  };

  const settings = { ...defaults, ...options };

  // Format the number with the specified decimal places
  const formatted = new Intl.NumberFormat('en', {
    minimumFractionDigits: settings.decimals,
    maximumFractionDigits: settings.decimals,
  })
    .format(amount)
    .replace(/,/g, '###THOUSAND###')
    .replace(/\./g, settings.decimalSeparator)
    .replace(/###THOUSAND###/g, settings.thousandSeparator);

  // Add currency symbol based on position
  return settings.position === 'before'
    ? `${settings.symbol}${formatted}`
    : `${formatted}${settings.symbol}`;
}
