'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminSettingsApi, superAdminDashboardApi } from '@/lib/api';
import { SuperAdminSettingsPayload } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DollarSign, RefreshCcw } from 'lucide-react';

interface StripeFormState {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
}

export default function SuperAdminBillingPage() {
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);
  const [stripeForm, setStripeForm] = useState<StripeFormState>({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
  });
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['super-admin', 'settings'],
    queryFn: async () => {
      const response = await superAdminSettingsApi.get();
      return response.data;
    },
  });

  const dashboardQuery = useQuery({
    queryKey: ['super-admin', 'dashboard', 'overview'],
    queryFn: async () => {
      const response = await superAdminDashboardApi.getOverview();
      return response.data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: SuperAdminSettingsPayload) => superAdminSettingsApi.update(payload),
    onSuccess: () => {
      toast.success('Stripe settings updated');
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'settings'] });
      setStripeDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update Stripe settings');
    },
  });

  const settings = settingsQuery.data;
  const stripe = settings?.stripe ?? {
    isConfigured: false,
  };
  const branding = settings?.branding ?? {
    productName: 'Zaydo',
    primaryColor: '#2563eb',
    accentColor: '#f97316',
  };
  const email = settings?.email ?? {
    fromName: 'Zaydo',
    fromEmail: 'no-reply@yourcompany.com',
    provider: 'postmark',
    isVerified: false,
  };
  const aiAssistant = settings?.aiAssistant ?? {
    provider: 'openai',
    isEnabled: false,
  };

  const overview = dashboardQuery.data;

  const handleOpenStripeDialog = () => {
    setStripeForm({
      publishableKey: stripe?.publishableKey ?? '',
      secretKey: '',
      webhookSecret: '',
    });
    setStripeDialogOpen(true);
  };

  const handleSaveStripe = async () => {
    if (!settings) return;

    await updateSettingsMutation.mutateAsync({
      branding,
      email,
      aiAssistant,
      stripe: {
        ...stripe,
        publishableKey: stripeForm.publishableKey,
        secretKey: stripeForm.secretKey || undefined,
        webhookSecret: stripeForm.webhookSecret || undefined,
      },
    } as SuperAdminSettingsPayload);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing & Stripe</h1>
        <p className="text-sm text-muted-foreground">
          Monitor revenue performance and keep Stripe credentials up to date for seamless tenant billing.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <DollarSign className="h-4 w-4 text-primary" />
                Monthly revenue
              </CardTitle>
              <CardDescription>Recurring revenue generated across all active tenants.</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={() => dashboardQuery.refetch()}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">
              ${overview?.kpis.monthlyRecurringRevenue.toLocaleString() ?? '0'}
            </p>
            <p className="text-sm text-muted-foreground">
              Annualized revenue: ${(overview?.kpis.arr ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">Stripe integration</CardTitle>
              <CardDescription>Connect your billing provider to sync invoices, subscriptions, and MRR.</CardDescription>
            </div>
            <Badge variant={stripe?.isConfigured ? 'default' : 'secondary'}>
              {stripe?.isConfigured ? 'Configured' : 'Not configured'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Publishable key</p>
              <p className="font-medium">{stripe?.publishableKey ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Secret key</p>
              <p className="font-medium">{stripe?.secretKeyMasked ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Webhook secret</p>
              <p className="font-medium">{stripe?.webhookSecretMasked ?? '—'}</p>
            </div>
            <div className="text-xs text-muted-foreground">
              Last synced:{' '}
              {stripe?.lastSyncedAt ? new Date(stripe.lastSyncedAt).toLocaleString() : 'Never synced'}
            </div>
            <Button onClick={handleOpenStripeDialog}>Edit Stripe credentials</Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={stripeDialogOpen} onOpenChange={setStripeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stripe credentials</DialogTitle>
            <DialogDescription>
              Enter secure keys generated from your Stripe dashboard. Secret values are stored encrypted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stripe-publishable">Publishable key</Label>
              <Input
                id="stripe-publishable"
                value={stripeForm.publishableKey}
                onChange={(event) =>
                  setStripeForm((prev) => ({ ...prev, publishableKey: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe-secret">Secret key</Label>
              <Input
                id="stripe-secret"
                type="password"
                placeholder="sk_live_..."
                value={stripeForm.secretKey}
                onChange={(event) => setStripeForm((prev) => ({ ...prev, secretKey: event.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to keep the existing secret key.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe-webhook">Webhook secret</Label>
              <Input
                id="stripe-webhook"
                type="password"
                placeholder="whsec_..."
                value={stripeForm.webhookSecret}
                onChange={(event) =>
                  setStripeForm((prev) => ({ ...prev, webhookSecret: event.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">Leave blank to keep the existing webhook secret.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStripeDialogOpen(false)} disabled={updateSettingsMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSaveStripe} disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


