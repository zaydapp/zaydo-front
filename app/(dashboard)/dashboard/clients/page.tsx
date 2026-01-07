'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { clientsApi } from '@/lib/api';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, Eye, Users } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenantSettings } from '@/hooks/useTenantSettings';

export default function ClientsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  // Fetch client types from tenant settings
  const { data: settingsData } = useTenantSettings('clients');
  const clientTypesSetting = settingsData?.find((s: any) => s.key === 'clients.types');
  const clientTypes = (clientTypesSetting?.value as Array<{ value: string; label: string }>) || [
    { value: 'INDIVIDUAL', label: 'Individual' },
    { value: 'COMPANY', label: 'Company' },
  ];
  
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, activeTab],
    queryFn: () => clientsApi.getAll({ 
      search, 
      kind: activeTab !== 'ALL' ? activeTab : undefined,
      take: 50 
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('clients.clientDeleted'));
    },
    onError: () => {
      toast.error(t('clients.deleteError'));
    },
  });

  const handleEdit = (id: string) => {
    router.push(`/dashboard/clients/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('clients.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('clients.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('clients.subtitle')}</p>
        </div>
        <Button onClick={() => router.push('/dashboard/clients/new')} size="default" className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          {t('clients.addClient')}
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
            {clientTypes.map((type) => {
              const valueKey = type.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const translationKey = `settings.settingValues.clients.${valueKey}`;
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

        {['ALL', ...clientTypes.map(t => t.value)].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-6 mt-6">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('clients.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-background shadow-sm border-muted"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {data?.pagination.total || 0} {t('common.results', { count: data?.pagination.total || 0 })}
              </div>
            </div>

            {/* Clients Table */}
            <ClientsTable
              clients={data?.data || []}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={(id) => router.push(`/dashboard/clients/${id}`)}
              deleteMutation={deleteMutation}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  deleteMutation: any;
}

function ClientsTable({ clients, isLoading, onEdit, onDelete, onView, deleteMutation }: ClientsTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">{t('clients.name')}</TableHead>
            <TableHead className="font-semibold">{t('clients.kind')}</TableHead>
            <TableHead className="font-semibold">{t('clients.email')}</TableHead>
            <TableHead className="font-semibold">{t('clients.phone')}</TableHead>
            <TableHead className="font-semibold">{t('clients.city')}</TableHead>
            <TableHead className="font-semibold">{t('clients.status')}</TableHead>
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
          ) : clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-muted p-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('clients.noClients')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('clients.noClientsDescription')}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow key={client.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {(() => {
                      const valueKey = client.kind.toLowerCase().replace(/[^a-z0-9]/g, '_');
                      const translationKey = `settings.settingValues.clients.${valueKey}`;
                      const translated = t(translationKey);
                      return translated !== translationKey ? translated : client.kind;
                    })()}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{client.email || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{client.phone || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{client.city || '-'}</TableCell>
                <TableCell>
                  <Badge 
                    variant={client.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className="font-normal"
                  >
                    {t(`clients.${client.status.toLowerCase()}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(client.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(client.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(client.id)}
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

