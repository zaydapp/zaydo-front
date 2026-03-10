'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { diversApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

export default function NewDiversPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  const createMutation = useMutation({
    mutationFn: diversApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divers'] });
      queryClient.invalidateQueries({ queryKey: ['orders-stats'] });
      toast.success(t('divers.created'));
      router.push('/dashboard/divers');
    },
    onError: () => {
      toast.error(t('divers.createError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('divers.invalidAmount'));
      return;
    }
    createMutation.mutate({
      name: formData.name,
      amount,
      expenseDate: formData.expenseDate,
      description: formData.description || undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('divers.add')}</h1>
          <p className="text-muted-foreground mt-1">{t('divers.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t('divers.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Salaires, Gazoil, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">{t('divers.amount')} *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="expenseDate">{t('divers.date')}</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">{t('divers.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('divers.descriptionPlaceholder')}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? t('common.creating') : t('common.create')}
          </Button>
        </div>
      </form>
    </div>
  );
}
