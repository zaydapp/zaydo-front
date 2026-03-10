'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { diversApi, type DiversExpense } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCurrency } from '@/hooks/use-currency';

export default function DiversPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { format: formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['divers', search],
    queryFn: () =>
      diversApi.getAll({
        search: search || undefined,
        take: 50,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: diversApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divers'] });
      queryClient.invalidateQueries({ queryKey: ['orders-stats'] });
      toast.success(t('divers.deleted'));
    },
    onError: () => {
      toast.error(t('divers.deleteError'));
    },
  });

  const handleEdit = (id: string) => {
    router.push(`/dashboard/divers/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('divers.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('divers.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('divers.subtitle')}</p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/divers/new')}
          size="default"
          className="shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('divers.add')}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('divers.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-background shadow-sm border-muted"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {data?.pagination.total || 0}{' '}
          {t('common.results', { count: data?.pagination.total || 0 })}
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">{t('divers.name')}</TableHead>
              <TableHead className="font-semibold">{t('divers.amount')}</TableHead>
              <TableHead className="font-semibold">{t('divers.date')}</TableHead>
              <TableHead className="font-semibold">{t('divers.description')}</TableHead>
              <TableHead className="text-right font-semibold">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : !data?.data?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-muted p-4">
                      <Wallet className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t('divers.empty')}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('divers.emptyDescription')}
                      </p>
                    </div>
                    <Button onClick={() => router.push('/dashboard/divers/new')} variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('divers.add')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{expense.name}</TableCell>
                  <TableCell>{formatCurrency(Number(expense.amount))}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(expense.expenseDate).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {expense.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(expense.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
