/*eslint-disable*/
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminSettingsApi } from '@/lib/api';
import { SuperAdminSettingsPayload } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

const brandingSchema = z.object({
  productName: z.string().min(2),
  logoUrl: z.string().url().or(z.literal('')).optional(),
  faviconUrl: z.string().url().or(z.literal('')).optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
});

const emailSchema = z.object({
  fromName: z.string().min(2),
  fromEmail: z.string().email(),
  replyToEmail: z.string().email().optional(),
  provider: z.enum(['postmark', 'sendgrid', 'smtp', 'resend', 'custom']),
});

const aiSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'azure', 'custom']).optional(),
  apiKey: z.string().optional(),
  isEnabled: z.boolean(),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;
type EmailFormValues = z.infer<typeof emailSchema>;
type AiFormValues = z.infer<typeof aiSchema>;

export default function SuperAdminSettingsPage() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['super-admin', 'settings'],
    queryFn: async () => {
      const response = await superAdminSettingsApi.get();
      return response.data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: SuperAdminSettingsPayload) => superAdminSettingsApi.update(payload),
    onSuccess: () => {
      toast.success('Settings updated');
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'settings'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update settings');
    },
  });

  const brandingForm = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      productName: '',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '',
      accentColor: '',
    },
  });

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      fromName: '',
      fromEmail: '',
      replyToEmail: '',
      provider: 'postmark',
    },
  });

  const aiForm = useForm<AiFormValues>({
    resolver: zodResolver(aiSchema),
    defaultValues: {
      provider: 'openai',
      apiKey: '',
      isEnabled: false,
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      const { branding, email, aiAssistant } = settingsQuery.data;
      if (branding) {
        brandingForm.reset({
          productName: branding.productName,
          logoUrl: branding.logoUrl ?? '',
          faviconUrl: branding.faviconUrl ?? '',
          primaryColor: branding.primaryColor ?? '',
          accentColor: branding.accentColor ?? '',
        });
      }

      if (email) {
        emailForm.reset({
          fromName: email.fromName,
          fromEmail: email.fromEmail,
          replyToEmail: email.replyToEmail ?? '',
          provider: email.provider ?? 'postmark',
        });
      }

      if (aiAssistant) {
        aiForm.reset({
          provider: aiAssistant.provider ?? 'openai',
          apiKey: aiAssistant.apiKeyMasked ? '' : '',
          isEnabled: aiAssistant.isEnabled ?? false,
        });
      }
    }
  }, [settingsQuery.data, brandingForm, emailForm, aiForm]);

  const handleSubmit = async () => {
    const brandingValues = await brandingForm.trigger();
    const emailValues = await emailForm.trigger();
    const aiValues = await aiForm.trigger();

    if (!brandingValues || !emailValues || !aiValues) {
      toast.error('Please fix validation errors before saving.');
      return;
    }

    const branding = brandingForm.getValues();
    const email = emailForm.getValues();
    const aiAssistant = aiForm.getValues();

    const payload: SuperAdminSettingsPayload = {
      branding,
      email: {
        ...email,
        isVerified: settingsQuery.data?.email?.isVerified ?? false,
      },
      stripe: settingsQuery.data?.stripe ?? {
        isConfigured: false,
      },
      aiAssistant: {
        provider: aiAssistant.provider,
        isEnabled: aiAssistant.isEnabled,
        apiKeyMasked: aiAssistant.apiKey ? '••••••' : settingsQuery.data?.aiAssistant?.apiKeyMasked,
        apiKey: aiAssistant.apiKey || undefined,
      },
    };

    await updateSettingsMutation.mutateAsync(payload);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SaaS Owner Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure the global branding, system email identity, and AI assistant integrations for
          every tenant experience.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>
              Customize the SaaS owner control center and tenant onboarding experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="branding-name">Product name</Label>
              <Input id="branding-name" {...brandingForm.register('productName')} />
              {brandingForm.formState.errors.productName && (
                <p className="text-sm text-destructive">
                  {brandingForm.formState.errors.productName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="branding-logo">Logo URL</Label>
              <Input
                id="branding-logo"
                {...brandingForm.register('logoUrl')}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branding-favicon">Favicon URL</Label>
              <Input
                id="branding-favicon"
                {...brandingForm.register('faviconUrl')}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branding-primary">Primary color</Label>
              <Input
                id="branding-primary"
                {...brandingForm.register('primaryColor')}
                placeholder="#2563eb"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branding-accent">Accent color</Label>
              <Input
                id="branding-accent"
                {...brandingForm.register('accentColor')}
                placeholder="#f97316"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System email</CardTitle>
            <CardDescription>
              Control the sender identity for transactional messages sent to tenants and their
              users.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email-from-name">From name</Label>
              <Input id="email-from-name" {...emailForm.register('fromName')} />
              {emailForm.formState.errors.fromName && (
                <p className="text-sm text-destructive">
                  {emailForm.formState.errors.fromName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-from-email">From email</Label>
              <Input id="email-from-email" {...emailForm.register('fromEmail')} />
              {emailForm.formState.errors.fromEmail && (
                <p className="text-sm text-destructive">
                  {emailForm.formState.errors.fromEmail.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-reply">Reply-to email</Label>
              <Input id="email-reply" {...emailForm.register('replyToEmail')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-provider">Email provider</Label>
              <Input
                id="email-provider"
                {...emailForm.register('provider')}
                placeholder="postmark"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI assistant</CardTitle>
            <CardDescription>
              Optional automation features for forecasting, knowledge base answers, and smart
              insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ai-provider">Provider</Label>
              <Input id="ai-provider" {...aiForm.register('provider')} placeholder="openai" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-key">API key</Label>
              <Input
                id="ai-key"
                type="password"
                placeholder="sk-..."
                {...aiForm.register('apiKey')}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to retain the existing encrypted key.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={aiForm.watch('isEnabled')}
                onCheckedChange={(checked) => aiForm.setValue('isEnabled', Boolean(checked))}
              />
              <Label className="text-sm">Enable AI assistant for tenants</Label>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              settingsQuery.refetch();
            }}
          >
            Reset changes
          </Button>
          <Button type="submit" disabled={updateSettingsMutation.isPending}>
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save configuration'}
          </Button>
        </div>
      </form>
    </div>
  );
}
