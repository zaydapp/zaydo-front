/*eslint-disable*/
'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Check } from 'lucide-react';
import { InvoiceLineInput } from '@/hooks/useInvoiceEditor';
import { useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';
import { ProductSelect } from '@/components/ui/product-select';

interface InvoiceItemRowProps {
  item: InvoiceLineInput;
  index: number;
  products: Array<{ id: string; name: string; unit: string; sku?: string }>;
  activeTaxes: Array<{ id: string; name: string; rate: number }>;
  onProductSelect: (index: number, productId: string) => void;
  onTaxSelect: (index: number, taxId: string) => void;
  onUpdate: (index: number, changes: Partial<InvoiceLineInput>) => void;
  onRemove: (index: number) => void;
}

export function InvoiceItemRow({
  item,
  index,
  products,
  activeTaxes,
  onProductSelect,
  onTaxSelect,
  onUpdate,
  onRemove,
}: InvoiceItemRowProps) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const [isNew, setIsNew] = useState(true);

  const lineSubtotal = item.quantity * item.unitPrice;
  const lineDiscount = item.discount || 0;
  const lineTaxable = lineSubtotal - lineDiscount;
  const lineTax = (lineTaxable * (item.taxRate || 0)) / 100;
  const lineTotal = lineTaxable + lineTax;

  useEffect(() => {
    const timer = setTimeout(() => setIsNew(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const selectedProduct = item.productId ? products.find((p) => p.id === item.productId) : null;

  // Handle product selection from dropdown
  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      onProductSelect(index, productId);
    }
  };

  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_70px_100px_80px_90px] md:grid-cols-[1fr_80px_110px_90px_100px] gap-2 md:gap-3 items-start py-3 px-3 md:px-4 border-b border-border/50 hover:bg-muted/30 transition-colors',
        isNew && 'opacity-0'
      )}
      style={
        isNew
          ? {
              animation: 'fadeIn 0.3s ease-in-out forwards',
            }
          : undefined
      }
    >
      {/* Product Column - Flexible */}
      <div className="min-w-0 flex items-start w-full">
        <div className="w-full">
          <ProductSelect
            value={item.productId || ''}
            onValueChange={(productId) => {
              if (productId) {
                handleProductSelect(productId);
              } else {
                // Allow clearing selection
                onUpdate(index, { productId: undefined, description: '' });
              }
            }}
            products={products}
            placeholder={
              item.productId
                ? t('orders.chooseProduct') || 'Search or type product...'
                : t('invoices.productDescription') || 'Search product or enter description...'
            }
            className="text-sm"
          />
          {selectedProduct?.sku && item.productId && (
            <p className="text-xs text-muted-foreground/70 mt-0.5 leading-tight">
              {t('products.sku') || 'SKU'}: {selectedProduct.sku}
            </p>
          )}
        </div>
      </div>

      {/* Quantity Column - Small Fixed */}
      <div className="flex items-start justify-end">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={item.quantity}
          onChange={(e) => onUpdate(index, { quantity: Number(e.target.value) })}
          className="text-right text-sm h-9 w-full"
          aria-label={t('orders.quantity') || 'Quantity'}
        />
      </div>

      {/* Unit Price Column - Medium Fixed */}
      <div className="flex items-start justify-end">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={item.unitPrice}
          onChange={(e) => onUpdate(index, { unitPrice: Number(e.target.value) })}
          className="text-right text-sm h-9 w-full"
          aria-label={t('orders.unitPrice') || 'Unit Price'}
        />
      </div>

      {/* Tax Column - Reduced Width */}
      <div className="flex items-start justify-end">
        <Select
          value={
            item.taxRate > 0 && activeTaxes.length > 0
              ? activeTaxes.find((t) => Math.abs(Number(t.rate) - item.taxRate) < 0.01)?.id || ''
              : ''
          }
          onValueChange={(value) => {
            if (value) {
              onTaxSelect(index, value);
            } else {
              onTaxSelect(index, 'none');
            }
          }}
        >
          <SelectTrigger className="w-full h-9 text-sm">
            <SelectValue>{item.taxRate > 0 ? `${item.taxRate}%` : '0%'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {activeTaxes.length > 0 ? (
              activeTaxes.map((tax) => (
                <SelectItem key={tax.id} value={tax.id}>
                  {tax.rate}%
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {t('taxes.noTaxes') || 'No taxes configured'}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Discount Column - Small Fixed */}
      <div className="flex items-start justify-end gap-1.5">
        <div className="flex-1 flex justify-end">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={item.discount}
            onChange={(e) => onUpdate(index, { discount: Number(e.target.value) })}
            className="text-right text-sm h-9 w-full"
            aria-label={t('orders.discount') || 'Discount'}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          aria-label={t('common.delete') || 'Delete item'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
