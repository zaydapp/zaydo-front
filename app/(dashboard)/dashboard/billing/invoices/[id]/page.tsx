'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi, productsApi, taxesApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/hooks/use-currency';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Printer, Download, ExternalLink, CreditCard, CornerDownLeft, Edit, Save, X, Plus, Loader2 } from 'lucide-react';
import { InvoicePrintView } from '@/components/invoices/invoice-print-view';
import { useInvoiceEditor, useInvoiceMutations } from '@/hooks/useInvoiceEditor';
import { InvoiceItemRow } from '@/components/invoices/invoice-item-row';
import { InvoiceFormSection } from '@/components/invoices/invoice-form-section';
import { InvoiceSummary } from '@/components/invoices/invoice-summary';
import { CreditNoteDialog } from '@/components/invoices/credit-note-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tax } from '@/lib/api/taxes';

export default function InvoiceDetailsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const { format } = useCurrency();
  const [isEditing, setIsEditing] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoicesApi.getById(invoiceId),
  });

  // Initialize editor state from invoice
  const getInitialState = () => {
    if (!invoice) return undefined;
    return {
      clientId: invoice.clientId,
      issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
      paymentTerms: invoice.paymentTerms,
      notes: invoice.notes,
      termsConditions: invoice.termsConditions,
      items: invoice.items?.map((item: any) => ({
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

  const { state, setState, totals, addLine, updateLine, removeLine } = useInvoiceEditor(getInitialState());
  const { updateInvoice, validateInvoice } = useInvoiceMutations();
  const [isCreditNoteDialogOpen, setIsCreditNoteDialogOpen] = useState(false);
  const [isCreatingCreditNote, setIsCreatingCreditNote] = useState(false);

  // Sync editor state when invoice loads
  useEffect(() => {
    if (invoice && !isEditing) {
      const initialState = getInitialState();
      if (initialState) {
        setState(initialState);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id, isEditing]);

  // Fetch products and taxes for editing
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll({ take: 200 }),
    enabled: isEditing,
  });
  const products = productsData?.data || [];

  const { data: taxes = [] } = useQuery({
    queryKey: ['taxes'],
    queryFn: taxesApi.getAll,
    enabled: isEditing,
  });
  const activeTaxes = taxes.filter((tax: Tax) => tax.isActive !== false);

  const handleDownload = async () => {
    if (!invoice) return;
    try {
      const blob = await invoicesApi.downloadPdf(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error(t('invoices.downloadError') || 'Unable to download invoice');
    }
  };

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

  const handleSave = async () => {
    if (!invoice) return;
    try {
      const payload = {
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
      await updateInvoice.mutateAsync({ id: invoice.id, data: payload });
      toast.success(t('invoices.invoiceUpdated') || 'Invoice updated successfully');
      setIsEditing(false);
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message
        : undefined;
      toast.error(message || t('invoices.updateError') || 'Failed to update invoice');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset state to original invoice data
    if (invoice) {
      const initialState = getInitialState();
      if (initialState) {
        setState(initialState);
      }
    }
  };

  const handleValidate = async () => {
    if (!invoice) return;
    try {
      const finalInvoice = await validateInvoice.mutateAsync({ id: invoice.id });
      toast.success(t('invoices.validated') || 'Facture validée');
      router.push(`/dashboard/billing/invoices/${finalInvoice.id}`);
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message
        : undefined;
      toast.error(message || t('invoices.updateError') || 'Échec de la validation de la facture');
    }
  };

  const handleCreateCreditNote = async (data: {
    items: Array<{
      itemId: string;
      quantity: number;
      reason: string;
    }>;
    reason: string;
    notes?: string;
  }) => {
    if (!invoice) return;
    setIsCreatingCreditNote(true);
    try {
      const creditNote = await invoicesApi.createCreditNote(invoice.id, data);
      toast.success(t('invoices.creditNoteCreated') || 'Avoir créé avec succès');
      setIsCreditNoteDialogOpen(false);
      router.push(`/dashboard/billing/invoices/${creditNote.id}`);
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message
        : undefined;
      toast.error(message || t('invoices.creditNoteError') || 'Échec de la création de l\'avoir');
    } finally {
      setIsCreatingCreditNote(false);
    }
  };

  if (isLoading) {
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
        <AlertDescription>{t('invoices.notFoundDescription') || 'This invoice could not be located.'}</AlertDescription>
      </Alert>
    );
  }

  const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    DRAFT: 'outline',
    SENT: 'default',
    PAID: 'default',
    OVERDUE: 'secondary',
    CANCELLED: 'secondary',
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('invoices.invoiceNumber') || 'Invoice Number'}</p>
          <h1 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={statusVariant[invoice.status] ?? 'secondary'}>{invoice.status}</Badge>
            {invoice.order && (
              <Badge variant="outline" className="flex items-center gap-1 cursor-pointer" onClick={() => router.push(`/dashboard/orders/${invoice.order.id}`)}>
                <ExternalLink className="h-3 w-3" />
                {t('invoices.generatedFromOrderShort', { number: invoice.order.orderNumber }) ||
                  `Order ${invoice.order.orderNumber}`}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {invoice?.status === 'DRAFT' && !isEditing && (
            <Button variant="outline" onClick={() => router.push(`/dashboard/billing/invoices/${invoice.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit') || 'Edit'}
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleSave} disabled={updateInvoice.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateInvoice.isPending ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save')}
              </Button>
            </>
          )}
          {!isEditing && (
            <>
              {invoice?.status === 'DRAFT' && (
                <Button onClick={handleValidate} disabled={validateInvoice.isPending}>
                  {validateInvoice.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.saving') || 'Validating...'}
                    </>
                  ) : (
                    <>
                      <CornerDownLeft className="h-4 w-4 mr-2" />
                      {t('invoices.validateInvoice') || 'Validate Invoice'}
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                {t('common.print')}
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                {t('common.download')}
              </Button>
              {invoice?.status !== 'DRAFT' && (
                <>
                  <Button variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t('invoices.recordPayment') || 'Record Payment'}
                  </Button>
                  {invoice?.status !== 'DRAFT' && (
                    <Button variant="outline" onClick={() => setIsCreditNoteDialogOpen(true)}>
                      <CornerDownLeft className="h-4 w-4 mr-2" />
                      {t('invoices.generateCreditNote') || 'Generate Avoir'}
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Print view - hidden on screen, visible when printing */}
      <div className="hidden print:block">
        <InvoicePrintView invoice={invoice} />
      </div>

      {/* Screen view - hidden when printing */}
      <div className="print:hidden space-y-6">
        {invoice.order && (
          <Alert>
            <AlertTitle>{t('invoices.orderReference') || 'Originating Order'}</AlertTitle>
            <AlertDescription className="flex items-center gap-2 text-sm">
              {t('invoices.generatedFromOrder', { number: invoice.order.orderNumber }) ||
                `Invoice generated from Order #${invoice.order.orderNumber}`}
              <Button variant="link" className="h-auto px-1" onClick={() => router.push(`/dashboard/orders/${invoice.order.id}`)}>
                {t('common.viewOrder') || 'View order'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {isEditing ? (
            <>
              {/* Billing Details Section - Editable */}
              <InvoiceFormSection
                title={t('invoices.billingDetails') || 'Détails de facturation'}
                description={t('invoices.billingDetailsDesc') || 'Dates, conditions de paiement et informations générales'}
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate" className="text-sm font-medium">
                      {t('invoices.issueDate') || 'Date d\'émission'}
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-sm font-medium">
                      {t('invoices.dueDate') || 'Date d\'échéance'}
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
                      placeholder={t('invoices.paymentTermsPlaceholder') || 'Ex: Net 30, Paiement à réception'}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </InvoiceFormSection>

              {/* Terms & Notes Section - Editable */}
              <InvoiceFormSection
                title={t('invoices.termsAndNotes') || 'Conditions & notes'}
                description={t('invoices.termsAndNotesDesc') || 'Notes internes et conditions générales pour cette facture'}
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
                      placeholder={t('invoices.termsPlaceholder') || 'Ajouter des conditions pour cette facture'}
                      rows={4}
                      className="mt-1.5 resize-none"
                    />
                  </div>
                </div>
              </InvoiceFormSection>

              {/* Line Items Section - Editable */}
              <InvoiceFormSection
                title={t('invoices.lineItems') || 'Lignes d\'articles'}
                description={t('invoices.lineItemsDesc') || 'Ajustez les quantités, prix unitaires et taxes avant d\'émettre'}
              >
                <div className="space-y-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_70px_100px_80px_90px] md:grid-cols-[1fr_80px_110px_90px_100px] gap-2 md:gap-3 items-start py-2.5 px-3 md:px-4 bg-muted/50 border-b border-border rounded-t-lg">
                    <div className="text-sm font-semibold">{t('orders.product') || 'Produit'}</div>
                    <div className="text-sm font-semibold text-right">Qte</div>
                    <div className="text-sm font-semibold text-right">{t('orders.unitPrice') || 'Prix Unitaire'}</div>
                    <div className="text-sm font-semibold text-right">{t('orders.tax') || 'Taxe'}</div>
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="text-sm font-semibold text-right flex-1">{t('orders.discount') || 'Remise'}</div>
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
                          {t('invoices.noLineItems') || 'Aucune ligne d\'article pour le moment.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Add Item Button */}
                  <Button
                    variant="outline"
                    className="w-full border-dashed hover:border-solid hover:bg-muted/50 transition-colors"
                    onClick={addLine}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('invoices.addItem') || 'Ajouter un article'}
                  </Button>
                </div>
              </InvoiceFormSection>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('invoices.items') || 'Invoice Lines'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>{t('orders.product')}</TableHead>
                        <TableHead className="text-right">{t('orders.quantity')}</TableHead>
                        <TableHead className="text-right">{t('orders.unitPrice')}</TableHead>
                        <TableHead className="text-right">{t('orders.tax')}</TableHead>
                        <TableHead className="text-right">{t('orders.lineTotal')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.description}</p>
                              {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">{format(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{item.taxRate}%</TableCell>
                          <TableCell className="text-right font-medium">
                            {format(item.totalAmount ?? item.quantity * item.unitPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {isEditing ? (
            <div className="sticky top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
              <InvoiceSummary
                subtotal={totals.subtotal}
                discount={totals.discount}
                tax={totals.tax}
                total={totals.total}
                isSaving={updateInvoice.isPending}
                canSubmit={Boolean(state.items.length > 0)}
                onSaveDraft={handleSave}
                onValidate={undefined}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('invoices.billingSummary') || 'Billing Summary'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>{t('invoices.subtotal')}</span>
                  <span className="font-medium">{format(invoice.subtotal ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('invoices.discount')}</span>
                  <span className="font-medium">{format(invoice.discountAmount ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('invoices.tax')}</span>
                  <span className="font-medium">{format(invoice.taxAmount ?? invoice.tax ?? 0)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>{t('invoices.totalDue') || 'Total Due'}</span>
                  <span>{format(invoice.totalAmount ?? invoice.total ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{t('invoices.paidAmount') || 'Paid'}</span>
                  <span className="font-medium">{format(invoice.paidAmount ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{t('invoices.balance') || 'Balance'}</span>
                  <span className="font-medium">{format(invoice.balanceAmount ?? 0)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t('invoices.meta') || 'Details'}</CardTitle>
              <CardDescription>{t('invoices.metaDesc') || 'Dates, payment terms & notes'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>{t('invoices.issueDate')}</span>
                <span className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('invoices.dueDate')}</span>
                <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</span>
              </div>
              {invoice.paymentTerms && (
                <div className="flex items-center justify-between">
                  <span>{t('invoices.paymentTerms')}</span>
                  <span className="font-medium">{invoice.paymentTerms}</span>
                </div>
              )}
              {invoice.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('invoices.notes')}</p>
                    <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>

      {/* Credit Note Dialog */}
      {invoice && (
        <CreditNoteDialog
          open={isCreditNoteDialogOpen}
          onOpenChange={setIsCreditNoteDialogOpen}
          invoice={invoice}
          onConfirm={handleCreateCreditNote}
          isCreating={isCreatingCreditNote}
        />
      )}
    </div>
  );
}

