'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { priceListsApi, PriceList } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Pencil, Trash2, Calendar, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PriceListsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: priceLists = [], isLoading } = useQuery({
    queryKey: ['price-lists'],
    queryFn: () => priceListsApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: priceListsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      toast.success(t('priceLists.deleteSuccess') || 'Price list deleted successfully');
      setDeleteId(null);
    },
    onError: () => {
      toast.error(t('priceLists.deleteError') || 'Failed to delete price list');
    },
  });

  const filteredPriceLists = priceLists.filter((priceList: PriceList) =>
    priceList.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(i18n.language || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isActiveNow = (priceList: PriceList) => {
    if (!priceList.isActive) return false;
    const now = new Date();
    const start = new Date(priceList.startDate);
    const end = priceList.endDate ? new Date(priceList.endDate) : null;
    return start <= now && (!end || end >= now);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RETAIL':
        return 'bg-blue-500';
      case 'WHOLESALE':
        return 'bg-purple-500';
      case 'PROMOTIONAL':
        return 'bg-orange-500';
      case 'SEASONAL':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('priceLists.title') || 'Price Lists'}</h1>
          <p className="text-muted-foreground mt-1">
            {t('priceLists.description') ||
              'Manage pricing for different periods and customer segments'}
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/price-lists/new')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('priceLists.newPriceList') || 'New Price List'}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('priceLists.searchPlaceholder') || 'Search price lists...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Price Lists Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('priceLists.name') || 'Name'}</TableHead>
                <TableHead>{t('priceLists.type') || 'Type'}</TableHead>
                <TableHead>{t('priceLists.period') || 'Period'}</TableHead>
                <TableHead>{t('priceLists.products') || 'Products'}</TableHead>
                <TableHead>{t('priceLists.status') || 'Status'}</TableHead>
                <TableHead className="text-right">{t('common.actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPriceLists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {search
                        ? t('priceLists.noResults') || 'No price lists found'
                        : t('priceLists.empty') || 'No price lists yet. Create your first one!'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPriceLists.map((priceList: PriceList) => (
                  <TableRow key={priceList.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {priceList.name}
                      </div>
                      {priceList.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {priceList.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(priceList.type)}>{priceList.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(priceList.startDate)}</div>
                        <div className="text-muted-foreground">
                          {priceList.endDate
                            ? `→ ${formatDate(priceList.endDate)}`
                            : `→ ${t('priceLists.noEndDate') || 'No end date'}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {priceList._count?.items || 0} {t('priceLists.items') || 'items'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isActiveNow(priceList) ? (
                        <Badge className="bg-green-500">{t('priceLists.active') || 'Active'}</Badge>
                      ) : !priceList.isActive ? (
                        <Badge variant="secondary">{t('priceLists.inactive') || 'Inactive'}</Badge>
                      ) : new Date(priceList.startDate) > new Date() ? (
                        <Badge className="bg-blue-500">
                          {t('priceLists.scheduled') || 'Scheduled'}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{t('priceLists.expired') || 'Expired'}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/price-lists/${priceList.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/price-lists/${priceList.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(priceList.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('priceLists.deleteConfirmTitle') || 'Delete Price List'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('priceLists.deleteConfirmMessage') ||
                'Are you sure? This will permanently delete this price list and all its pricing data.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
