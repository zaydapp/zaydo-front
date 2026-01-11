/*eslint-disable*/
'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DollarSign, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurrencySettings } from '@/components/settings/finance/currency-settings';
import { PaymentTerms } from '@/components/settings/finance/payment-terms';
import { InvoiceNumberingRules } from '@/components/settings/billing/invoice-numbering-rules';
import TaxesPage from '../taxes/page';

export default function FinancePage() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="space-y-6 pb-8">
      {/* Header with back button */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/settings')}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back') || 'Back to Settings'}
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t('settings.categories.finance') || 'Financial Settings'}
              </h1>
            </div>
            <p className="text-muted-foreground ml-14">
              {t('settings.finance.pageDescription') || 'Manage taxes, currency, and payment terms'}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="taxes" className="space-y-6">
        <TabsList className="grid w-full max-w-[800px] grid-cols-4">
          <TabsTrigger value="taxes">{t('settings.finance.taxes') || 'Taxes'}</TabsTrigger>
          <TabsTrigger value="currency">{t('settings.finance.currency') || 'Currency'}</TabsTrigger>
          <TabsTrigger value="payment-terms">
            {t('settings.finance.paymentTerms') || 'Payment Terms'}
          </TabsTrigger>
          <TabsTrigger value="invoice-numbering">
            {t('settings.finance.invoiceNumbering') || 'Invoice Numbering'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="taxes" className="space-y-4">
          <TaxesPage {...({ hideHeader: true } as any)} />
        </TabsContent>

        <TabsContent value="currency">
          <CurrencySettings />
        </TabsContent>

        <TabsContent value="payment-terms">
          <PaymentTerms />
        </TabsContent>

        <TabsContent value="invoice-numbering" className="space-y-4">
          <InvoiceNumberingRules />
        </TabsContent>
      </Tabs>
    </div>
  );
}
