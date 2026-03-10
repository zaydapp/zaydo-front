'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
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
import { useOrder } from '@/hooks/useOrder';
import { useInvoiceEditor, useInvoiceMutations } from '@/hooks/useInvoiceEditor';
import { productsApi, taxesApi, clientsApi } from '@/lib/api';
import { Client } from '@/types';
import { Tax } from '@/lib/api/taxes';
import { toast } from 'sonner';
import { InvoiceHeader } from '@/components/invoices/invoice-header';
import { InvoiceFormSection } from '@/components/invoices/invoice-form-section';
import { InvoiceItemRow } from '@/components/invoices/invoice-item-row';
import { InvoiceSummary } from '@/components/invoices/invoice-summary';

export default function NewInvoicePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromOrder = searchParams.get('fromOrder');
  const { data: order, isLoading: isOrderLoading } = useOrder(fromOrder || undefined);
  const { state, setState, totals, addLine, updateLine, removeLine } = useInvoiceEditor({}, order);
  const { createInvoice, validateInvoice } = useInvoiceMutations();
  const [clientType, setClientType] = useState<'client' | 'passenger'>(
    fromOrder ? 'client' : 'client'
  );
  const [passengerName, setPassengerName] = useState('');
  const [passengerClientId, setPassengerClientId] = useState<string | null>(null);

  // Mutation to create a temporary client for passengers
  const createPassengerClient = useMutation({
    mutationFn: async (name: string) => {
      const client = await clientsApi.create({
        name: name.trim(),
        kind: 'INDIVIDUAL' as const,
      });
      return client.id;
    },
  });

  // Fetch clients for client selection
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll({ take: 200 }),
    enabled: !fromOrder, // Only fetch if not creating from order
  });
  const clients = clientsData?.data || [];

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

  useEffect(() => {
    if (order && (order.invoice || (order.invoices && order.invoices.length > 0))) {
      const existing = order.invoice || order.invoices?.[0];
      toast.error(t('orders.alreadyInvoiced') || 'Order already has an invoice');
      if (existing) {
        router.replace(`/dashboard/billing/invoices/${existing.id}`);
      }
    }
  }, [order, router, t]);

  const isSaving =
    createInvoice.isPending || validateInvoice.isPending || createPassengerClient.isPending;
  const canSubmit = Boolean(
    (state.clientId || (clientType === 'passenger' && passengerName.trim())) &&
    state.items.length > 0
  );

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

  const buildPayload = async () => {
    let finalClientId: string;

    if (clientType === 'client') {
      if (!state.clientId) {
        throw new Error('Missing client');
      }
      finalClientId = state.clientId;
    } else {
      // For passengers, create or reuse a temporary client
      if (!passengerName.trim()) {
        throw new Error('Missing passenger name');
      }

      // If we already created a client for this passenger, reuse it
      if (passengerClientId) {
        finalClientId = passengerClientId;
      } else {
        // Create a new client for this passenger
        const clientId = await createPassengerClient.mutateAsync(passengerName.trim());
        setPassengerClientId(clientId);
        finalClientId = clientId;
      }
    }

    return {
      clientId: finalClientId,
      issueDate: state.issueDate,
      dueDate: state.dueDate,
      paymentTerms: state.paymentTerms,
      notes: state.notes,
      termsConditions: state.termsConditions,
      orderId: fromOrder ?? undefined,
      items: state.items.map((item) => ({
        productId: item.productId || '',
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        discount: item.discount,
        notes: item.notes,
      })) as Parameters<typeof createInvoice.mutateAsync>[0]['items'],
    };
  };

  const handleSaveDraft = async () => {
    try {
      const payload = await buildPayload();
      const invoice = await createInvoice.mutateAsync(payload);
      toast.success(
        t('invoices.saved') || t('invoices.draftSaved') || 'Facture enregistrée comme brouillon'
      );
      router.push(`/dashboard/billing/invoices/${invoice.id}`);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { message?: string } })?.data?.message
          : undefined;
      toast.error(
        message || t('invoices.updateError') || "Échec de l'enregistrement de la facture"
      );
    }
  };

  const handleValidate = async () => {
    try {
      const payload = await buildPayload();
      const invoice = await createInvoice.mutateAsync(payload);
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

  if (fromOrder && isOrderLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="space-y-8 pt-6">
        {/* Header */}
        <InvoiceHeader fromOrder={fromOrder} order={order || undefined} />

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Client Information Section */}
            <InvoiceFormSection
              title={t('clients.client') || 'Informations client'}
              description={
                t('invoices.clientInfoDesc') || 'Informations du client liées à cette facture'
              }
            >
              <div className="space-y-4">
                {fromOrder ? (
                  // When creating from order, show disabled input with order's client
                  <div>
                    <Label htmlFor="client" className="text-sm font-medium">
                      {t('clients.client') || 'Client'}
                    </Label>
                    <Input
                      id="client"
                      value={order?.client?.name || ''}
                      disabled
                      className="mt-1.5 bg-muted"
                      aria-label={t('clients.client') || 'Client'}
                    />
                  </div>
                ) : (
                  // When creating new invoice, show client selection or passenger input
                  <>
                    <div>
                      <Label htmlFor="clientType" className="text-sm font-medium">
                        {t('invoices.clientType') || 'Type de client'}
                      </Label>
                      <Select
                        value={clientType}
                        onValueChange={(value: 'client' | 'passenger') => {
                          setClientType(value);
                          if (value === 'client') {
                            setPassengerName('');
                          } else {
                            setState((prev) => ({ ...prev, clientId: undefined }));
                          }
                        }}
                      >
                        <SelectTrigger id="clientType" className="mt-1.5 w-full">
                          <SelectValue
                            placeholder={t('invoices.selectClientType') || 'Sélectionner le type'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">{t('clients.client') || 'Client'}</SelectItem>
                          <SelectItem value="passenger">
                            {t('invoices.passenger') || 'Passager'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {clientType === 'client' ? (
                      <div>
                        <Label htmlFor="client" className="text-sm font-medium">
                          {t('clients.client') || 'Client'}
                        </Label>
                        <Select
                          value={state.clientId || ''}
                          onValueChange={(value) => {
                            setState((prev) => ({ ...prev, clientId: value }));
                          }}
                        >
                          <SelectTrigger id="client" className="mt-1.5 w-full">
                            <SelectValue
                              placeholder={t('clients.selectClient') || 'Sélectionner un client'}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client: Client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="passengerName" className="text-sm font-medium">
                          {t('invoices.passengerName') || 'Nom du passager'}
                        </Label>
                        <Input
                          id="passengerName"
                          value={passengerName}
                          onChange={(e) => setPassengerName(e.target.value)}
                          placeholder={
                            t('invoices.passengerNamePlaceholder') || 'Entrer le nom du passager'
                          }
                          className="mt-1.5"
                          aria-label={t('invoices.passengerName') || 'Nom du passager'}
                        />
                      </div>
                    )}
                  </>
                )}
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
                          key={index}
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
                onSaveDraft={handleSaveDraft}
                onValidate={handleValidate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
