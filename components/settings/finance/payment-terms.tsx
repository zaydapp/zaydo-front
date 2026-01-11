'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantSettings, useUpdateSetting } from '@/hooks/useTenantSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
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

interface PaymentTerm {
  value: string;
  label: string;
  days: number;
  isDefault?: boolean;
}

export function PaymentTerms() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useTenantSettings('finance');
  const updateSetting = useUpdateSetting();

  interface TenantSetting {
    id: string;
    key: string;
    value: unknown;
    category: string;
    description?: string;
    isSystem: boolean;
  }

  const paymentTermsSetting = settings?.find(
    (s: TenantSetting) => s.key === 'finance.payment_terms'
  );
  const terms: PaymentTerm[] = (paymentTermsSetting?.value as PaymentTerm[] | undefined) || [];

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<PaymentTerm>({
    value: '',
    label: '',
    days: 0,
    isDefault: false,
  });

  const handleAdd = async () => {
    if (!formData.value || !formData.label) {
      toast.error(t('settings.finance.fillRequired') || 'Please fill in all required fields');
      return;
    }

    const newTerms = [...terms, formData];
    try {
      await updateSetting.mutateAsync({
        key: 'finance.payment_terms',
        data: { value: newTerms },
      });
      toast.success(t('settings.finance.termAdded') || 'Payment term added successfully');
      setFormData({ value: '', label: '', days: 0, isDefault: false });
      setShowAddForm(false);
    } catch (error) {
      toast.error(t('settings.updateError') || 'Failed to update payment terms');
    }
  };

  const handleUpdate = async () => {
    if (editingIndex === null) return;

    const newTerms = [...terms];
    newTerms[editingIndex] = formData;

    try {
      await updateSetting.mutateAsync({
        key: 'finance.payment_terms',
        data: { value: newTerms },
      });
      toast.success(t('settings.finance.termUpdated') || 'Payment term updated successfully');
      setEditingIndex(null);
    } catch (error) {
      toast.error(t('settings.updateError') || 'Failed to update payment terms');
    }
  };

  const handleDelete = async () => {
    if (deleteIndex === null) return;

    const newTerms = terms.filter((_, index) => index !== deleteIndex);
    try {
      await updateSetting.mutateAsync({
        key: 'finance.payment_terms',
        data: { value: newTerms },
      });
      toast.success(t('settings.finance.termDeleted') || 'Payment term deleted successfully');
      setDeleteIndex(null);
    } catch (error) {
      toast.error(t('settings.updateError') || 'Failed to delete payment term');
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setFormData({ ...terms[index] });
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('settings.finance.paymentTerms') || 'Payment Terms'}</CardTitle>
              <CardDescription>
                {t('settings.finance.paymentTermsDescription') ||
                  'Configure payment terms for invoices and orders'}
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('common.add') || 'Add'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddForm && (
            <div className="rounded-lg border p-4 space-y-4 bg-muted/50">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="new-value">{t('settings.finance.termValue') || 'Value'} *</Label>
                  <Input
                    id="new-value"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value.toUpperCase() })
                    }
                    placeholder={t('settings.finance.termValuePlaceholder') || 'NET_30'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-label">{t('settings.finance.termLabel') || 'Label'} *</Label>
                  <Input
                    id="new-label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder={t('settings.finance.termLabelPlaceholder') || 'Net 30 days'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-days">{t('settings.finance.days') || 'Days'}</Label>
                  <Input
                    id="new-days"
                    type="number"
                    min="0"
                    value={formData.days}
                    onChange={(e) =>
                      setFormData({ ...formData, days: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} size="sm" disabled={updateSetting.isPending}>
                  <Check className="h-4 w-4 mr-2" />
                  {t('common.add') || 'Add'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel') || 'Cancel'}
                </Button>
              </div>
            </div>
          )}

          {terms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('settings.finance.noPaymentTerms') || 'No payment terms configured'}
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-sm">
                      {t('settings.finance.termValue') || 'Value'}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm">
                      {t('settings.finance.termLabel') || 'Label'}
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-sm">
                      {t('settings.finance.days') || 'Days'}
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-sm">
                      {t('common.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {terms.map((term, index) => (
                    <tr
                      key={index}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {editingIndex === index ? (
                        <>
                          <td className="py-3 px-4">
                            <Input
                              value={formData.value}
                              onChange={(e) =>
                                setFormData({ ...formData, value: e.target.value.toUpperCase() })
                              }
                              className="h-9"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              value={formData.label}
                              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                              className="h-9"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              min="0"
                              value={formData.days}
                              onChange={(e) =>
                                setFormData({ ...formData, days: parseInt(e.target.value) || 0 })
                              }
                              className="h-9 w-24 mx-auto"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" onClick={handleUpdate} className="h-8">
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingIndex(null)}
                                className="h-8"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {term.value}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-medium">{term.label}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="outline">
                              {term.days} {t('settings.finance.daysShort') || 'd'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(index)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteIndex(index)}
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

      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('settings.finance.deletePaymentTerm') || 'Delete Payment Term'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.finance.deletePaymentTermConfirm') ||
                'Are you sure you want to delete this payment term?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t('common.delete') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
