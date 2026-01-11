'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInvoiceEditor, useInvoiceMutations } from '@/hooks/useInvoiceEditor';
import { Invoice, InvoiceItem } from '@/types';
import { productsApi, taxesApi } from '@/lib/api';
import { Tax } from '@/lib/api/taxes';
import { toast } from 'sonner';
import { InvoiceHeader } from '@/components/invoices/invoice-header';
import { InvoiceFormSection } from '@/components/invoices/invoice-form-section';
import { InvoiceItemRow } from '@/components/invoices/invoice-item-row';
import { InvoiceSummary } from '@/components/invoices/invoice-summary';
import { invoicesApi } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EditInvoicePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const { data: invoice, isLoading: isInvoiceLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoicesApi.getById(invoiceId),
  });

  // Initialize editor state from invoice
  const getInitialState = () => {
    if (!invoice) return undefined;
    return {
      clientId: invoice.clientId,
      issueDate: invoice.issueDate
        ? new Date(invoice.issueDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate).toISOString().slice(0, 10)
        : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
      paymentTerms: invoice.paymentTerms,
      notes: invoice.notes,
      termsConditions: invoice.termsConditions,
      items:
        invoice.items?.map((item: InvoiceItem) => ({
          id: item.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0,
          discount: item.discount || 0,
          notes: item.notes,
        })) || [],
    };
  };

  const { state, setState, totals, addLine, updateLine, removeLine } =
    useInvoiceEditor(getInitialState());
  const { updateInvoice, validateInvoice } = useInvoiceMutations();

  // Fetch products for product selection
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll({ take: 200 }),
  });
  const products = productsData?.data || [];

  // Fetch taxes for tax selection
  const { data: taxes = [] } = useQuery({
    queryKey: ['taxes'],
    queryFn: taxesApi.getAll,
  });
  const activeTaxes = taxes.filter((tax: Tax) => tax.isActive !== false);

  // Sync editor state when invoice loads
  useEffect(() => {
    if (invoice) {
      const initialState = getInitialState();
      if (initialState) {
        setState(initialState);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id]);

  // Check if invoice is draft
  useEffect(() => {
    if (invoice && invoice.status !== 'DRAFT') {
      toast.error(t('invoices.canOnlyEditDraft') || 'Only draft invoices can be edited');
      router.replace(`/dashboard/billing/invoices/${invoice.id}`);
    }
  }, [invoice, router, t]);

  const isSaving = updateInvoice.isPending || validateInvoice.isPending;
  const canSubmit = Boolean(state.clientId && state.items.length > 0);

  // Handle product selection - automatically populate unit
  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const updates: {
        productId: string;
        description: string;
        unit: string;
        unitPrice?: number;
      } = {
        productId: product.id,
        description: product.name,
        unit: product.unit,
      };
      if ('sellingPrice' in product && product.sellingPrice) {
        updates.unitPrice = Number(product.sellingPrice);
      }
      updateLine(index, updates);
    }
  };

  // Handle tax selection - automatically populate tax rate
  const handleTaxSelect = (index: number, taxId: string) => {
    if (taxId === 'none' || !taxId) {
      updateLine(index, { taxRate: 0 });
      return;
    }
    const tax = activeTaxes.find((t) => t.id === taxId);
    if (tax) {
      updateLine(index, { taxRate: Number(tax.rate) });
    }
  };

  const buildPayload = () => {
    if (!state.clientId) {
      throw new Error('Missing client');
    }

    return {
      issueDate: state.issueDate,
      dueDate: state.dueDate,
      paymentTerms: state.paymentTerms,
      notes: state.notes,
      termsConditions: state.termsConditions,
      items: state.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        discount: item.discount,
        notes: item.notes,
      })),
    };
  };

  const handleSave = async () => {
    if (!invoice) return;
    try {
      const payload = buildPayload();
      await updateInvoice.mutateAsync({ id: invoice.id, data: payload });
      toast.success(t('invoices.invoiceUpdated') || 'Invoice updated successfully');
      router.push(`/dashboard/billing/invoices/${invoice.id}`);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { message?: string } })?.data?.message
          : undefined;
      toast.error(message || t('invoices.updateError') || 'Échec de la mise à jour de la facture');
    }
  };

  const handleValidate = async () => {
    if (!invoice) return;
    try {
      // First save any changes
      const payload = buildPayload();
      await updateInvoice.mutateAsync({ id: invoice.id, data: payload });

      // Then validate the invoice
      const finalInvoice = await validateInvoice.mutateAsync({ id: invoice.id });
      toast.success(t('invoices.validated') || 'Facture validée');
      router.push(`/dashboard/billing/invoices/${finalInvoice.id}`);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { message?: string } })?.data?.message
          : undefined;
      toast.error(message || t('invoices.updateError') || 'Échec de la validation de la facture');
    }
  };

  if (isInvoiceLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('invoices.notFound') || 'Invoice not found'}</AlertTitle>
        <AlertDescription>
          {t('invoices.notFoundDescription') || 'This invoice could not be located.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (invoice.status !== 'DRAFT') {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('invoices.cannotEdit') || 'Cannot Edit Invoice'}</AlertTitle>
        <AlertDescription>
          {t('invoices.canOnlyEditDraft') ||
            'Only draft invoices can be edited. This invoice has already been validated.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="space-y-8 pt-6">
        {/* Header */}
        <InvoiceHeader fromOrder={undefined} order={invoice.order || undefined} />

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Client Information Section - Read Only */}
            <InvoiceFormSection
              title={t('clients.client') || 'Informations client'}
              description={
                t('invoices.clientInfoDesc') || 'Informations du client liées à cette facture'
              }
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client" className="text-sm font-medium">
                    {t('clients.client') || 'Client'}
                  </Label>
                  <Input
                    id="client"
                    value={invoice.client?.name || ''}
                    disabled
                    className="mt-1.5 bg-muted"
                    aria-label={t('clients.client') || 'Client'}
                  />
                </div>
              </div>
            </InvoiceFormSection>

            {/* Billing Details Section */}
            <InvoiceFormSection
              title={t('invoices.billingDetails') || 'Détails de facturation'}
              description={
                t('invoices.billingDetailsDesc') ||
                'Dates, conditions de paiement et informations générales'
              }
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issueDate" className="text-sm font-medium">
                    {t('invoices.issueDate') || "Date d'émission"}
                  </Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={state.issueDate}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        issueDate: e.target.value,
                      }))
                    }
                    className="mt-1.5"
                    aria-label={t('invoices.issueDate') || "Date d'émission"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-sm font-medium">
                    {t('invoices.dueDate') || "Date d'échéance"}
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={state.dueDate}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                    className="mt-1.5"
                    aria-label={t('invoices.dueDate') || "Date d'échéance"}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="paymentTerms" className="text-sm font-medium">
                    {t('invoices.paymentTerms') || 'Conditions de paiement'}
                  </Label>
                  <Input
                    id="paymentTerms"
                    value={state.paymentTerms || ''}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        paymentTerms: e.target.value,
                      }))
                    }
                    placeholder={
                      t('invoices.paymentTermsPlaceholder') || 'Ex: Net 30, Paiement à réception'
                    }
                    className="mt-1.5"
                    aria-label={t('invoices.paymentTerms') || 'Conditions de paiement'}
                  />
                </div>
              </div>
            </InvoiceFormSection>

            {/* Terms & Notes Section */}
            <InvoiceFormSection
              title={t('invoices.termsAndNotes') || 'Conditions & notes'}
              description={
                t('invoices.termsAndNotesDesc') ||
                'Notes internes et conditions générales pour cette facture'
              }
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    {t('invoices.notes') || 'Notes'}
                  </Label>
                  <Textarea
                    id="notes"
                    value={state.notes || ''}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder={t('invoices.notesPlaceholder') || 'Ajouter une note interne'}
                    rows={3}
                    className="mt-1.5 resize-none"
                    aria-label={t('invoices.notes') || 'Notes'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termsConditions" className="text-sm font-medium">
                    {t('invoices.termsConditions') || 'Conditions générales'}
                  </Label>
                  <Textarea
                    id="termsConditions"
                    value={state.termsConditions || ''}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        termsConditions: e.target.value,
                      }))
                    }
                    placeholder={
                      t('invoices.termsPlaceholder') || 'Ajouter des conditions pour cette facture'
                    }
                    rows={4}
                    className="mt-1.5 resize-none"
                    aria-label={t('invoices.termsConditions') || 'Conditions générales'}
                  />
                </div>
              </div>
            </InvoiceFormSection>

            {/* Line Items Section */}
            <InvoiceFormSection
              title={t('invoices.lineItems') || "Lignes d'articles"}
              description={
                t('invoices.lineItemsDesc') ||
                "Ajustez les quantités, prix unitaires et taxes avant d'émettre"
              }
            >
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_70px_100px_80px_90px] md:grid-cols-[1fr_80px_110px_90px_100px] gap-2 md:gap-3 items-start py-2.5 px-3 md:px-4 bg-muted/50 border-b border-border rounded-t-lg">
                  <div className="text-sm font-semibold">{t('orders.product') || 'Produit'}</div>
                  <div className="text-sm font-semibold text-right">Qte</div>
                  <div className="text-sm font-semibold text-right">
                    {t('orders.unitPrice') || 'Prix Unitaire'}
                  </div>
                  <div className="text-sm font-semibold text-right">
                    {t('orders.tax') || 'Taxe'}
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="text-sm font-semibold text-right flex-1">
                      {t('orders.discount') || 'Remise'}
                    </div>
                    <div className="w-8"></div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="border border-border rounded-lg overflow-hidden">
                  {state.items.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {state.items.map((item, index) => (
                        <InvoiceItemRow
                          key={item.id || index}
                          item={item}
                          index={index}
                          products={products}
                          activeTaxes={activeTaxes}
                          onProductSelect={handleProductSelect}
                          onTaxSelect={handleTaxSelect}
                          onUpdate={updateLine}
                          onRemove={removeLine}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('invoices.noLineItems') || "Aucune ligne d'article pour le moment."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Add Item Button */}
                <Button
                  variant="outline"
                  className="w-full border-dashed hover:border-solid hover:bg-muted/50 transition-colors"
                  onClick={addLine}
                  aria-label={t('invoices.addItem') || 'Ajouter un article'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('invoices.addItem') || 'Ajouter un article'}
                </Button>
              </div>
            </InvoiceFormSection>
          </div>

          {/* Right Column - Sticky Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
              <InvoiceSummary
                subtotal={totals.subtotal}
                discount={totals.discount}
                tax={totals.tax}
                total={totals.total}
                isSaving={isSaving}
                canSubmit={canSubmit}
                onSaveDraft={handleSave}
                onValidate={handleValidate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
