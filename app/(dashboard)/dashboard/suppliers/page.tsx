'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { suppliersApi } from '@/lib/api';
import { Supplier } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, Eye, Truck } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useTenantSettings } from '@/hooks/useTenantSettings';

export default function SuppliersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  // Fetch supplier types from tenant settings
  const { data: settingsData } = useTenantSettings('suppliers');
  const supplierTypesSetting = settingsData?.find((s: any) => s.key === 'suppliers.types');
  const supplierTypes = (supplierTypesSetting?.value as Array<{ value: string; label: string }>) || [
    { value: 'RAW_MATERIAL', label: 'Raw Materials' },
    { value: 'PACKAGING', label: 'Packaging' },
  ];
  
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search, activeTab],
    queryFn: () => suppliersApi.getAll({ 
      search, 
      type: activeTab !== 'ALL' ? activeTab : undefined,
      take: 50 
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: suppliersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(t('suppliers.supplierDeleted'));
    },
    onError: () => {
      toast.error(t('suppliers.deleteError'));
    },
  });

  const handleEdit = (id: string) => {
    router.push(`/dashboard/suppliers/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('suppliers.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('suppliers.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('suppliers.subtitle')}</p>
        </div>
        <Button onClick={() => router.push('/dashboard/suppliers/new')} size="default" className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          {t('suppliers.addSupplier')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="space-y-6">
        <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10 -mx-6 px-6 pb-0">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-3">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`relative px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'ALL'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="relative z-10">{t('common.all')}</span>
              {activeTab === 'ALL' && (
                <span className="absolute inset-x-0 -bottom-3 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            {supplierTypes.map((type) => {
              const valueKey = type.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const translationKey = `settings.settingValues.suppliers.${valueKey}`;
              const label = t(translationKey) !== translationKey ? t(translationKey) : type.label;
              const isActive = activeTab === type.value;
              
              return (
                <button
                  key={type.value}
                  onClick={() => setActiveTab(type.value)}
                  className={`relative px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-t-lg ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="relative z-10">{label}</span>
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-3 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {['ALL', ...supplierTypes.map(t => t.value)].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-6 mt-6">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('suppliers.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-background shadow-sm border-muted"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {data?.pagination.total || 0} {t('common.results', { count: data?.pagination.total || 0 })}
              </div>
            </div>

            {/* Suppliers Table */}
            <SuppliersTable
              suppliers={data?.data || []}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={(id) => router.push(`/dashboard/suppliers/${id}`)}
              deleteMutation={deleteMutation}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface SuppliersTableProps {
  suppliers: Supplier[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  deleteMutation: any;
}

function SuppliersTable({ suppliers, isLoading, onEdit, onDelete, onView, deleteMutation }: SuppliersTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">{t('suppliers.name')}</TableHead>
            <TableHead className="font-semibold">{t('suppliers.type')}</TableHead>
            <TableHead className="font-semibold">{t('suppliers.contactPerson')}</TableHead>
            <TableHead className="font-semibold">{t('suppliers.phone')}</TableHead>
            <TableHead className="font-semibold">{t('suppliers.city')}</TableHead>
            <TableHead className="font-semibold">{t('suppliers.status')}</TableHead>
            <TableHead className="text-right font-semibold">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : suppliers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-muted p-4">
                    <Truck className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('suppliers.noSuppliers')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('suppliers.noSuppliersDescription')}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            suppliers.map((supplier) => (
              <TableRow key={supplier.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {(() => {
                      const valueKey = supplier.type.toLowerCase().replace(/[^a-z0-9]/g, '_');
                      const translationKey = `settings.settingValues.suppliers.${valueKey}`;
                      const translated = t(translationKey);
                      return translated !== translationKey ? translated : supplier.type;
                    })()}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{supplier.contactPerson || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{supplier.phone || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{supplier.city || '-'}</TableCell>
                <TableCell>
                  <Badge 
                    variant={supplier.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className="font-normal"
                  >
                    {t(`suppliers.${supplier.status.toLowerCase()}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(supplier.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(supplier.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(supplier.id)}
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
  );
}
