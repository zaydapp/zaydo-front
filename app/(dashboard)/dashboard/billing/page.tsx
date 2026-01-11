'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  Download,
  FileText,
  Eye,
  Edit,
  Receipt,
  Calendar,
  X,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  FileX,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { useInvoices, useInvoiceStats } from '@/hooks/useInvoices';
import { Invoice, InvoiceStatus } from '@/types';
import { format } from 'date-fns';

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  className = '',
}: {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card className={`rounded-xl shadow-sm ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          {Icon && <Icon className="h-8 w-8 text-muted-foreground/50" />}
        </div>
      </CardContent>
    </Card>
  );
}

// Mobile Invoice Card Component
function InvoiceCardMobile({
  invoice,
  format: formatCurrency,
}: {
  invoice: Invoice;
  format: (value: number) => string;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const getStatusBadge = (status: InvoiceStatus) => {
    const statusMap: Record<
      InvoiceStatus,
      {
        label: string;
        variant: 'default' | 'secondary' | 'destructive';
        className?: string;
      }
    > = {
      DRAFT: {
        label: t('invoices.status.draft') || 'Brouillon',
        variant: 'secondary',
      },
      SENT: {
        label: t('invoices.status.validated') || 'Validée',
        variant: 'default',
      },
      PAID: {
        label: t('invoices.status.paid') || 'Payée',
        variant: 'default',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
      OVERDUE: {
        label: t('invoices.status.overdue') || 'En retard',
        variant: 'destructive',
      },
      CANCELLED: {
        label: t('invoices.status.cancelled') || 'Annulée',
        variant: 'secondary',
      },
    };
    const statusInfo = statusMap[status];
    return (
      <Badge variant={statusInfo.variant} className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const handleDownloadPdf = async () => {
    try {
      const { invoicesApi } = await import('@/lib/api');
      const blob = await invoicesApi.downloadPdf(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-lg">{invoice.invoiceNumber}</p>
            <p className="text-sm text-muted-foreground">{invoice.client?.name || 'N/A'}</p>
          </div>
          {getStatusBadge(invoice.status)}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Date d&apos;émission</p>
            <p className="font-medium">{format(new Date(invoice.issueDate), 'dd MMM yyyy')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date d&apos;échéance</p>
            <p className="font-medium">{format(new Date(invoice.dueDate), 'dd MMM yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-lg font-bold">{formatCurrency(invoice.totalAmount)}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/billing/invoices/${invoice.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {t('common.view') || 'Voir'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/billing/invoices/${invoice.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('common.edit') || 'Modifier'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                {t('invoices.downloadPdf') || 'Télécharger PDF'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvoicesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { format: formatCurrency } = useCurrency();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // API calls
  const {
    data: invoices = [],
    isLoading: isLoadingInvoices,
    error: invoicesError,
  } = useInvoices({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    clientId: clientFilter !== 'all' ? clientFilter : undefined,
    search: searchQuery || undefined,
  });

  const { data: stats, isLoading: isLoadingStats } = useInvoiceStats();

  // Get unique clients for filter
  const uniqueClients = useMemo(() => {
    const clients = new Map<string, string>();
    invoices.forEach((inv) => {
      if (inv.client) {
        clients.set(inv.client.id, inv.client.name);
      }
    });
    return Array.from(clients.entries()).map(([id, name]) => ({ id, name }));
  }, [invoices]);

  // Calculate KPIs from stats and invoices
  const kpis = useMemo(() => {
    if (!stats) {
      return {
        totalThisMonth: 0,
        pending: 0,
        overdue: 0,
        paid: 0,
        drafts: 0,
        creditNotes: 0,
      };
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonthInvoices = invoices.filter((inv) => {
      const date = new Date(inv.issueDate);
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        inv.status !== InvoiceStatus.CANCELLED
      );
    });

    const totalThisMonth = thisMonthInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    // Pending = SENT status invoices
    const pending = invoices
      .filter((inv) => inv.status === InvoiceStatus.SENT)
      .reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);

    const overdue = invoices
      .filter((inv) => inv.status === InvoiceStatus.OVERDUE)
      .reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);

    const paid = Number(stats.totals.totalPaid) || 0;

    const drafts = stats.byStatus.draft || 0;

    // Credit notes - invoices with negative total or cancelled
    const creditNotes = invoices.filter(
      (inv) => Number(inv.totalAmount) < 0 || inv.status === InvoiceStatus.CANCELLED
    ).length;

    return {
      totalThisMonth,
      pending,
      overdue,
      paid,
      drafts,
      creditNotes,
    };
  }, [stats, invoices]);

  // Filter invoices (client-side for additional filtering if needed)
  const filteredInvoices = useMemo(() => {
    return invoices;
  }, [invoices]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setClientFilter('all');
    setCurrentPage(1);
  };

  // Status badge helper
  const getStatusBadge = (status: InvoiceStatus) => {
    const statusMap: Record<
      InvoiceStatus,
      {
        label: string;
        variant: 'default' | 'secondary' | 'destructive';
        className?: string;
      }
    > = {
      DRAFT: {
        label: t('invoices.status.draft') || 'Brouillon',
        variant: 'secondary',
      },
      SENT: {
        label: t('invoices.status.validated') || 'Validée',
        variant: 'default',
      },
      PAID: {
        label: t('invoices.status.paid') || 'Payée',
        variant: 'default',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
      OVERDUE: {
        label: t('invoices.status.overdue') || 'En retard',
        variant: 'destructive',
      },
      CANCELLED: {
        label: t('invoices.status.cancelled') || 'Annulée',
        variant: 'secondary',
      },
    };
    const statusInfo = statusMap[status];
    return (
      <Badge variant={statusInfo.variant} className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const { invoicesApi } = await import('@/lib/api');
      const blob = await invoicesApi.downloadPdf(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || clientFilter !== 'all';
  const isLoading = isLoadingInvoices || isLoadingStats;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('invoices.title') || 'Factures'}</h1>
          <p className="text-muted-foreground mt-1">
            {t('invoices.subtitle') || 'Gérez vos factures et paiements'}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search') || 'Rechercher...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => router.push('/dashboard/billing/invoices/new')}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('invoices.newInvoice') || 'Nouvelle facture'}
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      {isLoadingStats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-xl shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="h-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title={t('invoices.kpi.totalThisMonth') || 'Total facturé ce mois'}
            value={formatCurrency(kpis.totalThisMonth)}
            icon={TrendingUp}
          />
          <StatCard
            title={t('invoices.kpi.pending') || 'En attente de paiement'}
            value={formatCurrency(kpis.pending)}
            icon={Clock}
          />
          <StatCard
            title={t('invoices.kpi.overdue') || 'En retard'}
            value={formatCurrency(kpis.overdue)}
            icon={AlertCircle}
            className="border-red-200"
          />
          <StatCard
            title={t('invoices.kpi.paid') || 'Payées'}
            value={formatCurrency(kpis.paid)}
            icon={CheckCircle}
            className="border-green-200"
          />
          <StatCard
            title={t('invoices.kpi.drafts') || 'Brouillons'}
            value={kpis.drafts}
            icon={FileText}
          />
          <StatCard
            title={t('invoices.kpi.creditNotes') || 'Avoirs émis'}
            value={kpis.creditNotes}
            icon={CreditCard}
          />
        </div>
      )}

      {/* Filters */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('common.filters') || 'Filtres'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('invoices.filter.status') || 'Statut'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('invoices.filter.allStatuses') || t('common.all') || 'All statuses'}
                </SelectItem>
                <SelectItem value={InvoiceStatus.DRAFT}>
                  {t('invoices.status.draft') || 'Brouillon'}
                </SelectItem>
                <SelectItem value={InvoiceStatus.SENT}>
                  {t('invoices.status.validated') || 'Validée'}
                </SelectItem>
                <SelectItem value={InvoiceStatus.PAID}>
                  {t('invoices.status.paid') || 'Payée'}
                </SelectItem>
                <SelectItem value={InvoiceStatus.OVERDUE}>
                  {t('invoices.status.overdue') || 'En retard'}
                </SelectItem>
                <SelectItem value={InvoiceStatus.CANCELLED}>
                  {t('invoices.status.cancelled') || 'Annulée'}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={clientFilter}
              onValueChange={(value) => {
                setClientFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('invoices.filter.client') || 'Client'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('invoices.filter.allClients') || t('common.all') || 'All clients'}
                </SelectItem>
                {uniqueClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            {hasActiveFilters && (
              <Button variant="outline" onClick={resetFilters} className="shrink-0">
                <X className="h-4 w-4 mr-2" />
                {t('common.resetFilters') || 'Réinitialiser'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table - Desktop */}
      <Card className="rounded-xl shadow-sm hidden md:block">
        <CardContent className="p-0">
          {isLoadingInvoices ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : invoicesError ? (
            <div className="p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p className="text-destructive">
                {t('common.errorLoading') || 'Erreur lors du chargement des factures'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">
                      {t('invoices.number') || 'N° Facture'}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t('clients.client') || 'Client'}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t('invoices.issueDate') || 'Date d&apos;émission'}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t('invoices.dueDate') || 'Date d&apos;échéance'}
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      {t('invoices.amount') || 'Montant (TTC)'}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t('invoices.invoicestatus') || 'Statut'}
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      {t('common.actions') || 'Actions'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {t('invoices.noInvoices') || 'Aucune facture trouvée'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.client?.name || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(invoice.issueDate), 'dd MMM yyyy')}</TableCell>
                        <TableCell>{format(new Date(invoice.dueDate), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                {t('common.actions') || 'Actions'}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/billing/invoices/${invoice.id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {t('common.view') || 'Voir'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/billing/invoices/${invoice.id}/edit`)
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('common.edit') || 'Modifier'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPdf(invoice.id)}>
                                <Download className="mr-2 h-4 w-4" />
                                {t('invoices.downloadPdf') || 'Télécharger PDF'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {isLoadingInvoices ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="rounded-xl shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : invoicesError ? (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p className="text-destructive">
                {t('common.errorLoading') || 'Erreur lors du chargement des factures'}
              </p>
            </CardContent>
          </Card>
        ) : paginatedInvoices.length === 0 ? (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {t('invoices.noInvoices') || 'Aucune facture trouvée'}
              </p>
            </CardContent>
          </Card>
        ) : (
          paginatedInvoices.map((invoice) => (
            <InvoiceCardMobile key={invoice.id} invoice={invoice} format={formatCurrency} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('common.showing') || 'Affichage'} {(currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredInvoices.length)}{' '}
            {t('common.of') || 'sur'} {filteredInvoices.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              {t('common.previous') || 'Précédent'}
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              {t('common.next') || 'Suivant'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
