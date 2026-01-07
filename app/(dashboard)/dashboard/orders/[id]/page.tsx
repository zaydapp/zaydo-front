'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ordersApi, invoicesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Calendar,
  Package,
  User,
  Building2,
  AlertCircle,
  FileText,
  Printer,
  Download,
  Receipt,
  ExternalLink,
  DownloadCloud,
  Info,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/use-currency';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function OrderDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { format: formatCurrency } = useCurrency();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId),
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // Dynamically import jsPDF and html2canvas
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      if (!order) throw new Error('Order not found');

      // Create a temporary container with the PDF content
      const container = document.createElement('div');
      container.style.width = '210mm';
      container.style.height = '297mm';
      container.style.padding = '20mm';
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.fontSize = '12px';
      container.style.color = '#000';
      container.style.position = 'absolute';
      container.style.left = '-9999px';

      // Header
      const header = document.createElement('div');
      header.style.marginBottom = '30px';
      header.style.textAlign = 'center';
      header.innerHTML = `
        <h1 style="font-size: 28px; font-weight: bold; margin: 0 0 20px 0;">BON DE COMMANDE</h1>
        <hr style="border: none; border-top: 2px solid #000; margin: 10px 0;"/>
      `;
      container.appendChild(header);

      // Order Info Section
      const orderInfo = document.createElement('div');
      orderInfo.style.display = 'grid';
      orderInfo.style.gridTemplateColumns = '1fr 1fr';
      orderInfo.style.gap = '20px';
      orderInfo.style.marginBottom = '20px';
      orderInfo.style.fontSize = '11px';

      const leftCol = document.createElement('div');
      leftCol.innerHTML = `
        <div style="margin-bottom: 10px;">
          <strong>Numéro de commande:</strong> ${order.orderNumber}
        </div>
        <div style="margin-bottom: 10px;">
          <strong>Date:</strong> ${format(new Date(order.orderDate), 'dd/MM/yyyy')}
        </div>
        <div>
          <strong>Tél.:</strong> _________________________
        </div>
      `;

      const rightCol = document.createElement('div');
      rightCol.innerHTML = `
        <div style="margin-bottom: 10px;">
          <strong>Nom:</strong> ${order.client?.name || order.supplier?.name || '___________'}
        </div>
        <div style="margin-bottom: 10px;">
          <strong>Adresse:</strong> ___________________________
        </div>
        <div>
          <strong>Email:</strong> ${order.client?.email || order.supplier?.email || '___________'}
        </div>
      `;

      orderInfo.appendChild(leftCol);
      orderInfo.appendChild(rightCol);
      container.appendChild(orderInfo);

      // Items Table
      const tableDiv = document.createElement('div');
      tableDiv.style.marginBottom = '20px';
      
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginBottom = '10px';
      table.style.fontSize = '11px';

      // Table Header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.borderBottom = '2px solid #000';
      headerRow.innerHTML = `
        <th style="text-align: left; padding: 8px; border: 1px solid #000; font-weight: bold;">DÉSIGNATION</th>
        <th style="text-align: center; padding: 8px; border: 1px solid #000; font-weight: bold;">QUANTITÉ</th>
        <th style="text-align: center; padding: 8px; border: 1px solid #000; font-weight: bold;">PRIX UNITAIRE</th>
        <th style="text-align: right; padding: 8px; border: 1px solid #000; font-weight: bold;">TOTAL</th>
      `;
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Table Body
      const tbody = document.createElement('tbody');
      order.items?.forEach((item: any) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="padding: 8px; border: 1px solid #000;">${item.productName}</td>
          <td style="padding: 8px; border: 1px solid #000; text-align: center;">${item.quantity} ${item.unit}</td>
          <td style="padding: 8px; border: 1px solid #000; text-align: center;">${formatCurrency(Number(item.unitPrice))}</td>
          <td style="padding: 8px; border: 1px solid #000; text-align: right;">${formatCurrency(Number(item.totalPrice))}</td>
        `;
        tbody.appendChild(row);
      });

      // Add empty rows
      for (let i = 0; i < 3; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="padding: 12px; border: 1px solid #000;">&nbsp;</td>
          <td style="padding: 12px; border: 1px solid #000;">&nbsp;</td>
          <td style="padding: 12px; border: 1px solid #000;">&nbsp;</td>
          <td style="padding: 12px; border: 1px solid #000;">&nbsp;</td>
        `;
        tbody.appendChild(row);
      }

      table.appendChild(tbody);
      tableDiv.appendChild(table);
      container.appendChild(tableDiv);

      // Summary Section
      const summary = document.createElement('div');
      summary.style.display = 'grid';
      summary.style.gridTemplateColumns = '1fr 1fr';
      summary.style.gap = '20px';
      summary.style.marginTop = '20px';
      summary.style.fontSize = '11px';

      const leftSummary = document.createElement('div');
      leftSummary.innerHTML = `
        <div style="margin-bottom: 8px;">
          <strong>Méthode de paiement:</strong> ☐ Espèce ☐ CB
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Moyen de Livraison:</strong> _____________________
        </div>
        <div>
          <strong>Numéro de suivi:</strong> _____________________
        </div>
      `;

      const rightSummary = document.createElement('div');
      rightSummary.innerHTML = `
        <div style="margin-bottom: 8px;">
          <strong>Sous-total:</strong> _____________________
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Taxe TVA:</strong> _____________________
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Promo:</strong> _____________________
        </div>
        <div style="border: 2px solid #000; padding: 8px; text-align: center;">
          <strong>Total: ${formatCurrency(Number(order.totalAmount))}</strong>
        </div>
      `;

      summary.appendChild(leftSummary);
      summary.appendChild(rightSummary);
      container.appendChild(summary);

      // Notes Section
      if (order.notes) {
        const notesDiv = document.createElement('div');
        notesDiv.style.marginTop = '20px';
        notesDiv.innerHTML = `
          <div style="border: 1px solid #000; padding: 10px; min-height: 50px;">
            <strong>NOTES:</strong><br/>
            ${order.notes.replace(/\n/g, '<br/>')}
          </div>
        `;
        container.appendChild(notesDiv);
      }

      // Footer
      const footer = document.createElement('div');
      footer.style.display = 'grid';
      footer.style.gridTemplateColumns = '1fr 1fr';
      footer.style.marginTop = '20px';
      footer.style.fontSize = '10px';
      footer.innerHTML = `
        <div>
          <strong>Date:</strong> _____________ À: _____
        </div>
        <div style="text-align: right;">
          <strong>Signature:</strong> _____________________
        </div>
      `;
      container.appendChild(footer);

      // Append to body temporarily
      document.body.appendChild(container);

      // Convert to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save(`${order.orderNumber}.pdf`);

      // Remove temporary container
      document.body.removeChild(container);

      toast.success(t('common.success'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('common.error'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">{t('orders.notFound')}</p>
          <Button onClick={() => router.push('/dashboard/orders')}>
            {t('common.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container,
          .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
      <div className="space-y-6 print-container" id="order-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/orders')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
            <p className="text-muted-foreground">
              {t('orders.orderDetails')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/orders/${orderId}/edit`)}
            className="print:hidden"
          >
            Éditer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="print:hidden"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGeneratingPdf ? t('common.loading') : t('common.download')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="print:hidden"
          >
            <Printer className="h-4 w-4 mr-2" />
            {t('common.print')}
          </Button>
          <span 
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: order.status?.color ? `${order.status.color}20` : '#f3f4f6',
              color: order.status?.color || '#6b7280',
              border: `1px solid ${order.status?.color || '#e5e7eb'}`
            }}
          >
            {order.status?.isSystem 
              ? t(`orderStatuses.systemStatuses.${order.status.slug}`)
              : order.status?.name}
          </span>
          <Badge variant="outline">
            {t(`orders.${order.type.toLowerCase()}`)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('orders.orderInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{t('orders.orderDate')}</p>
                <p className="font-medium">{format(new Date(order.orderDate), 'PPP')}</p>
              </div>
            </div>

            {order.deliveryDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('orders.deliveryDate')}</p>
                  <p className="font-medium">{format(new Date(order.deliveryDate), 'PPP')}</p>
                </div>
              </div>
            )}

            {order.client && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('clients.client')}</p>
                  <p className="font-medium">{order.client.name}</p>
                </div>
              </div>
            )}

            {order.supplier && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('suppliers.supplier')}</p>
                  <p className="font-medium">{order.supplier.name}</p>
                </div>
              </div>
            )}

            {order.createdBy && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('orders.createdBy')}</p>
                  <p className="font-medium">{order.createdBy}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <InvoicePanel order={order} />

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t('orders.orderSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('orders.totalItems')}</p>
                  <p className="text-2xl font-bold">{order.items?.length || 0}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('orders.totalAmount')}</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(Number(order.totalAmount))}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>{t('orders.orderItems')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>{t('orders.product')}</TableHead>
                  <TableHead className="text-right">{t('orders.quantity')}</TableHead>
                  <TableHead className="text-right">{t('orders.unitPrice')}</TableHead>
                  <TableHead className="text-right">{t('orders.lineTotal')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">{item.notes}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(item.unitPrice))}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(item.totalPrice))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total */}
          <div className="flex justify-end pt-4 border-t mt-4">
            <div className="space-y-2 w-full md:w-1/3">
              <div className="flex justify-between text-lg font-bold">
                <span>{t('orders.total')}:</span>
                <span>
                  {formatCurrency(Number(order.totalAmount))}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{t('orders.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
          </CardContent>
        </Card>
      )}
      </div>
    </>
  );
}

function InvoicePanel({ order }: { order: any }) {
  const router = useRouter();
  const { format: formatCurrency } = useCurrency();
  const [isDownloading, setIsDownloading] = useState(false);
  const invoice = order?.invoice || order?.invoices?.[0];

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    SENT: 'bg-blue-100 text-blue-700',
    PAID: 'bg-emerald-100 text-emerald-700',
    OVERDUE: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-200 text-gray-600',
  };

  const handleDownloadInvoice = async () => {
    if (!invoice) return;
    setIsDownloading(true);
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
      toast.error('Unable to download invoice PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!invoice) {
    return (
      <Card className="h-fit overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 py-5">
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            Invoice
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            This order has not been invoiced yet. Generate a draft invoice using the order data in one click.
          </p>
        </div>
        <CardContent className="space-y-4 pt-6">
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
            <Info className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Why create an invoice?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Generates the next invoice number automatically</li>
                <li>Locks pricing and totals for finance</li>
                <li>Unlocks PDF export & payment tracking</li>
              </ul>
            </div>
          </div>
          <div className="grid gap-2">
            <Button className="w-full" onClick={() => router.push(`/dashboard/billing/invoices/new?fromOrder=${order.id}`)}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/billing/invoices/new')}>
              Create manually
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit overflow-hidden">
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 py-5 flex items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Invoice #{invoice.invoiceNumber}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Issued {new Date(invoice.issueDate).toLocaleDateString()} · Due {new Date(invoice.dueDate).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[invoice.status] ?? 'bg-muted text-muted-foreground'}`}
        >
          {invoice.status}
        </span>
      </div>
      <CardContent className="space-y-5 pt-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border bg-muted/30 px-3 py-3">
            <p className="text-xs text-muted-foreground">Billed amount</p>
            <p className="text-lg font-semibold">{formatCurrency(invoice.totalAmount ?? invoice.total ?? 0)}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-3">
            <p className="text-xs text-muted-foreground">Balance due</p>
            <p className="text-lg font-semibold">{formatCurrency(invoice.balanceAmount ?? 0)}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Status</span>
            <Badge variant="outline">{invoice.status}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Paid</span>
            <span className="font-medium">{formatCurrency(invoice.paidAmount ?? 0)}</span>
          </div>
        </div>
        <Separator />
        <div className="grid gap-2">
          <Button className="w-full" asChild>
            <Link href={`/dashboard/billing/invoices/${invoice.id}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Invoice
            </Link>
          </Button>
          <Button variant="outline" className="w-full" onClick={handleDownloadInvoice} disabled={isDownloading}>
            <DownloadCloud className="h-4 w-4 mr-2" />
            {isDownloading ? 'Preparing…' : 'Download PDF'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
