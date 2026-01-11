'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Order } from '@/types';

interface InvoiceHeaderProps {
  fromOrder?: string | null;
  order?: Order | null;
}

export function InvoiceHeader({ fromOrder, order }: InvoiceHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label={t('common.back') || 'Back'}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {t('invoices.newInvoice') || 'Nouvelle facture'}
            </h1>
            <Badge variant="secondary" className="text-xs">
              {t('invoices.statusDraft') || 'Brouillon'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {fromOrder && order
              ? t('invoices.orderBannerDescription', { number: order.orderNumber }) ||
                `Facture générée à partir de la commande #${order.orderNumber}`
              : t('invoices.createFromScratch') ||
                'Remplissez les détails de la facture manuellement.'}
          </p>
        </div>
      </div>
      {fromOrder && order && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/orders/${order.id}`)}
          className="shrink-0"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {t('common.viewOrder') || 'Voir la commande'}
        </Button>
      )}
    </div>
  );
}
