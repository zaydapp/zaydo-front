'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Pencil, Check, X, Percent, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
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

interface Tax {
  id: string;
  name: string;
  rate: number;
  code: string;
  description?: string;
  isActive: boolean;
}

interface TaxesPageProps {
  hideHeader?: boolean;
}

export default function TaxesPage({ hideHeader = false }: TaxesPageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [newTaxCode, setNewTaxCode] = useState('');
  const [newTaxDescription, setNewTaxDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: taxes = [], isLoading, error } = useQuery({
    queryKey: ['taxes'],
    queryFn: taxesApi.getAll,
  });

  console.log('Taxes Query:', { taxes, isLoading, error });

  const createMutation = useMutation({
    mutationFn: taxesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast.success(t('taxes.createSuccess') || 'Tax created successfully');
      setNewTaxName('');
      setNewTaxRate('');
      setNewTaxCode('');
      setNewTaxDescription('');
      setShowAddForm(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('taxes.createError') || 'Failed to create tax');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => taxesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast.success(t('taxes.updateSuccess') || 'Tax updated successfully');
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('taxes.updateError') || 'Failed to update tax');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taxesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast.success(t('taxes.deleteSuccess') || 'Tax deleted successfully');
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('taxes.deleteError') || 'Failed to delete tax');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: taxesApi.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast.success(t('taxes.toggleSuccess') || 'Tax status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('taxes.toggleError') || 'Failed to update tax status');
    },
  });

  const handleAdd = () => {
    if (!newTaxName) {
      toast.error(t('taxes.nameRequired') || 'Name is required');
      return;
    }
    if (!newTaxRate) {
      toast.error(t('taxes.rateRequired') || 'Rate is required');
      return;
    }

    const rate = parseFloat(newTaxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error(t('taxes.rateInvalid') || 'Rate must be between 0 and 100');
      return;
    }

    createMutation.mutate({
      name: newTaxName,
      rate,
      code: newTaxCode || undefined,
      description: newTaxDescription || undefined,
    });
  };

  const handleEdit = (tax: Tax) => {
    setEditingId(tax.id);
    setEditName(tax.name);
    setEditRate(tax.rate.toString());
    setEditCode(tax.code);
    setEditDescription(tax.description || '');
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    if (!editName) {
      toast.error(t('taxes.nameRequired') || 'Name is required');
      return;
    }

    if (!editRate) {
      toast.error(t('taxes.rateRequired') || 'Rate is required');
      return;
    }

    const rate = parseFloat(editRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error(t('taxes.rateInvalid') || 'Rate must be between 0 and 100');
      return;
    }

    updateMutation.mutate({
      id: editingId,
      data: {
        name: editName,
        rate,
        code: editCode,
        description: editDescription || null,
      },
    });
  };

  const handleToggleActive = (id: string) => {
    toggleMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {!hideHeader && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/settings')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back') || 'Back'}
            </Button>
          </div>
        )}
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header with back button */}
      {!hideHeader && (
        <>
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/settings')} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back') || 'Back to Settings'}
            </Button>
            
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Percent className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {t('taxes.title') || 'Taxes & Tax Rates'}
                  </h1>
                </div>
                <p className="text-muted-foreground ml-14">
                  {t('taxes.description') || 'Configure tax rates for your products and services'}
                </p>
              </div>
              <Button onClick={() => setShowAddForm(!showAddForm)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                {t('taxes.addTax') || 'Add Tax'}
              </Button>
            </div>
          </div>
          <Separator />
        </>
      )}

      {hideHeader && (
        <div className="flex items-end justify-end">
          <Button onClick={() => setShowAddForm(!showAddForm)} size="default">
            <Plus className="h-4 w-4 mr-2" />
            {t('taxes.addTax') || 'Add Tax'}
          </Button>
        </div>
      )}

      {showAddForm && (
        <Card className="border-primary/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t('taxes.newTax') || 'New Tax'}</CardTitle>
            <CardDescription>
              {t('taxes.newTaxDescription') || 'Add a new tax rate to your system'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-name" className="text-sm font-medium">
                  {t('taxes.name') || 'Name'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="new-name"
                  value={newTaxName}
                  onChange={(e) => setNewTaxName(e.target.value)}
                  placeholder={t('taxes.namePlaceholder') || 'e.g., VAT Standard'}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-rate" className="text-sm font-medium">
                  {t('taxes.rate') || 'Rate (%)'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="new-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={newTaxRate}
                  onChange={(e) => setNewTaxRate(e.target.value)}
                  placeholder="19.00"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-code" className="text-sm font-medium">
                  {t('taxes.code') || 'Code'} <span className="text-muted-foreground text-xs">({t('common.optional') || 'Optional'})</span>
                </Label>
                <Input
                  id="new-code"
                  value={newTaxCode}
                  onChange={(e) => setNewTaxCode(e.target.value)}
                  placeholder={t('taxes.codePlaceholder') || 'e.g., VAT_STD'}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-description" className="text-sm font-medium">
                  {t('taxes.description') || 'Description'} <span className="text-muted-foreground text-xs">({t('common.optional') || 'Optional'})</span>
                </Label>
                <Input
                  id="new-description"
                  value={newTaxDescription}
                  onChange={(e) => setNewTaxDescription(e.target.value)}
                  placeholder={t('taxes.descriptionPlaceholder') || 'Add details about this tax'}
                  className="h-10"
                />
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Button onClick={handleAdd} disabled={createMutation.isPending} size="default">
                <Check className="h-4 w-4 mr-2" />
                {t('common.create') || 'Create'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} size="default">
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel') || 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('taxes.currentTaxes') || 'Current Taxes'}</CardTitle>
          <CardDescription>
            {taxes.length > 0 
              ? `${taxes.length} ${taxes.length === 1 ? 'tax rate' : 'tax rates'} configured`
              : t('taxes.noTaxes') || 'No taxes configured yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {taxes.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Percent className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">{t('taxes.noTaxes') || 'No taxes configured yet'}</p>
              <Button onClick={() => setShowAddForm(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {t('taxes.addTax') || 'Add Your First Tax'}
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-sm">{t('taxes.name') || 'Name'}</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">{t('taxes.rate') || 'Rate'}</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">{t('taxes.code') || 'Code'}</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">{t('taxes.description') || 'Description'}</th>
                    <th className="text-center py-3 px-4 font-medium text-sm">{t('taxes.active') || 'Active'}</th>
                    <th className="text-right py-3 px-4 font-medium text-sm">{t('common.actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {taxes.map((tax: Tax, index: number) => (
                    <tr key={tax.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      {editingId === tax.id ? (
                        <>
                          <td className="py-3 px-4">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-9"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={editRate}
                              onChange={(e) => setEditRate(e.target.value)}
                              className="h-9 w-24"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              value={editCode}
                              onChange={(e) => setEditCode(e.target.value)}
                              className="h-9 w-32"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="h-9"
                            />
                          </td>
                          <td className="py-3 px-4 text-center"></td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" onClick={handleSaveEdit} variant="default" className="h-8">
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8">
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 font-medium">{tax.name}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="font-mono">
                              {tax.rate}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {tax.code ? (
                              <Badge variant="secondary" className="font-mono text-xs">
                                {tax.code}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-muted-foreground max-w-xs truncate block">
                              {tax.description || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center">
                              <Switch
                                checked={tax.isActive}
                                onCheckedChange={() => handleToggleActive(tax.id)}
                                disabled={toggleMutation.isPending}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(tax)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteId(tax.id)}
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('taxes.deleteTitle') || 'Delete Tax'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('taxes.deleteConfirm') || 'Are you sure you want to delete this tax? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground"
            >
              {t('common.delete') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
