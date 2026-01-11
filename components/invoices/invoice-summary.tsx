'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';

interface InvoiceSummaryProps {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  isSaving: boolean;
  canSubmit: boolean;
  onSaveDraft: () => void;
  onValidate?: () => void;
  className?: string;
}

export function InvoiceSummary({
  subtotal,
  discount,
  tax,
  total,
  isSaving,
  canSubmit,
  onSaveDraft,
  onValidate,
  className,
}: InvoiceSummaryProps) {
  const { t } = useTranslation();
  const { format } = useCurrency();

  return (
    <div className={cn('space-y-6', className)}>
      <Card className="shadow-md border-2 border-primary/10 bg-gradient-to-br from-background to-muted/20 rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t('invoices.summary') || 'Résumé'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t('invoices.subtotal') || 'Sous-total'}
              </span>
              <span className="font-medium">{format(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('invoices.discount') || 'Remise'}</span>
              <span className="font-medium">{format(discount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('invoices.tax') || 'Taxe'}</span>
              <span className="font-medium">{format(tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-xl font-bold pt-2">
              <span>{t('invoices.total') || 'Total'}</span>
              <span className="text-primary">{format(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-xl">
        <CardContent className="pt-6 space-y-3">
          {onValidate && (
            <Button
              className="w-full h-11 text-base font-semibold"
              onClick={onValidate}
              disabled={isSaving || !canSubmit}
              aria-label={t('invoices.validateInvoice') || 'Valider la Facture'}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('common.saving') || 'Enregistrement...'}
                </>
              ) : (
                t('invoices.validateInvoice') || 'Valider la Facture'
              )}
            </Button>
          )}
          <Button
            variant={onValidate ? 'outline' : 'default'}
            className="w-full h-11 text-base font-semibold"
            onClick={onSaveDraft}
            disabled={isSaving || !canSubmit}
            aria-label={
              onValidate
                ? t('invoices.saveAsDraft') || 'Enregistrer comme Brouillon'
                : t('common.save') || 'Enregistrer'
            }
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('common.saving') || 'Enregistrement...'}
              </>
            ) : onValidate ? (
              t('invoices.saveAsDraft') || 'Enregistrer comme Brouillon'
            ) : (
              t('common.save') || 'Enregistrer'
            )}
          </Button>
          {!canSubmit && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              {t('invoices.clientRequired') ||
                "Sélectionnez une commande avec un client avant d'émettre la facture."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
