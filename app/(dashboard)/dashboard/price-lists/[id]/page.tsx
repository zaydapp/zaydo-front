'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, DownloadCloud, Pencil, Tag } from 'lucide-react';
import { priceListsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/use-currency';

interface PriceListItem {
  id: string;
  productId: string;
  price: number;
  product?: {
    name: string;
    unit?: string;
  };
  productName?: string;
}

interface PriceList {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  clientGroup?: string | null;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  items: PriceListItem[];
}

export default function PriceListDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const { format: formatCurrency } = useCurrency();

  const priceListId = params?.id;

  const { data: priceList, isLoading, isError } = useQuery({
    queryKey: ['price-lists', priceListId],
    queryFn: () => priceListsApi.getById(priceListId as string),
    enabled: Boolean(priceListId),
  });

  const formatDate = (date?: string | null) => {
    if (!date) {
      return t('priceLists.noEndDate') || 'No end date';
    }

    return new Date(date).toLocaleDateString(i18n.language || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString(i18n.language || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number | string) => {
    const numeric = typeof price === 'number' ? price : parseFloat(price);
    if (Number.isFinite(numeric)) {
      return formatCurrency(numeric);
    }
    return price.toString();
  };

  const handleDownload = async () => {
    if (!priceListId) return;
    try {
      setIsDownloading(true);
      const blob = await priceListsApi.downloadPdf(priceListId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${priceList?.name || 'price-list'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('priceLists.downloadSuccess') || 'Price list downloaded');
    } catch (error) {
      console.error(error);
      toast.error(t('priceLists.downloadError') || 'Failed to download price list');
    } finally {
      setIsDownloading(false);
    }
  };

  const statusBadge = useMemo(() => {
    if (!priceList) return null;

    const now = new Date();
    const start = new Date(priceList.startDate);
    const end = priceList.endDate ? new Date(priceList.endDate) : null;

    if (!priceList.isActive) {
      return <Badge variant="secondary">{t('priceLists.inactive') || 'Inactive'}</Badge>;
    }

    if (start > now) {
      return <Badge className="bg-blue-500">{t('priceLists.scheduled') || 'Scheduled'}</Badge>;
    }

    if (end && end < now) {
      return <Badge variant="outline">{t('priceLists.expired') || 'Expired'}</Badge>;
    }

    return <Badge className="bg-green-500">{t('priceLists.active') || 'Active'}</Badge>;
  }, [priceList, t]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t('priceLists.loadingPriceList') || 'Loading price list...'}</div>
      </div>
    );
  }

  if (isError || !priceList) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-destructive">
          {t('priceLists.loadError') || 'Failed to load price list.'}
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard/price-lists')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('priceLists.backToList') || 'Back to price lists'}
        </Button>
      </div>
    );
  }

  const itemsCount = priceList.items?.length || 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            {t('priceLists.viewPriceList') || 'Price List Details'}
          </p>
          <h1 className="text-3xl font-bold">{priceList.name}</h1>
          <p className="text-muted-foreground mt-1">
            {t('priceLists.lastUpdated') || 'Last updated'}: {formatDateTime(priceList.updatedAt || priceList.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/price-lists')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('priceLists.backToList') || 'Back to price lists'}
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-gradient-to-r from-primary via-purple-500 to-indigo-600 text-white shadow-lg hover:opacity-90 transition"
          >
            <DownloadCloud className="mr-2 h-4 w-4" />
            {isDownloading
              ? t('priceLists.downloading') || 'Preparing PDF...'
              : t('priceLists.downloadPdf') || 'Download PDF'}
          </Button>
          <Button onClick={() => router.push(`/dashboard/price-lists/${priceList.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t('priceLists.editPriceList') || 'Edit Price List'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('priceLists.overview') || 'Overview'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">{t('priceLists.type') || 'Type'}</p>
              <p className="text-lg font-semibold mt-1">{priceList.type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('priceLists.status') || 'Status'}</p>
              <div className="mt-1">{statusBadge}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('priceLists.products') || 'Products'}</p>
              <p className="text-lg font-semibold mt-1">
                {t('priceLists.itemsCount', { count: itemsCount }) || `${itemsCount} items`}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <p className="text-sm text-muted-foreground">{t('priceLists.period') || 'Period'}</p>
              <div className="mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p>{formatDate(priceList.startDate)}</p>
                  <p className="text-muted-foreground text-sm">
                    {priceList.endDate
                      ? `→ ${formatDate(priceList.endDate)}`
                      : `→ ${t('priceLists.noEndDate') || 'No end date'}`}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('priceLists.clientGroup') || 'Client Group'}</p>
              <p className="mt-1">{priceList.clientGroup || '-'}</p>
            </div>
          </div>

          {priceList.description && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">{t('priceLists.description') || 'Description'}</p>
              <p className="mt-1">{priceList.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('priceLists.productsAndPrices') || 'Products & Prices'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {itemsCount === 0 ? (
            <div className="py-12 text-center">
              <Tag className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {t('priceLists.noProducts') || 'No products added yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('priceLists.product') || 'Product'}</TableHead>
                  <TableHead>{t('priceLists.price') || 'Price'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceList.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>{item.product?.name || item.productName || t('priceLists.unknownProduct') || 'Unknown product'}</div>
                      <p className="text-xs text-muted-foreground">{item.productId}</p>
                    </TableCell>
                    <TableCell>{formatPrice(item.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

