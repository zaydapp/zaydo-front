'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { clientsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Mail, Phone, MapPin, FileText, Calendar, DollarSign, Package, Edit, Trash2, AlertCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/use-currency';
import { format } from 'date-fns';

export default function ClientDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { format: formatCurrency } = useCurrency();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.getById(clientId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 animate-pulse text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">{t('clients.notFound')}</p>
          <Button onClick={() => router.push('/dashboard/clients')}>
            {t('common.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/clients')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">
              {t('clients.clientDetails')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
          <Badge variant={client.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {t(`clients.${client.status.toLowerCase()}`)}
          </Badge>
          <Badge variant="outline">
            {(() => {
              const valueKey = client.kind.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const translationKey = `settings.settingValues.clients.${valueKey}`;
              const translated = t(translationKey);
              return translated !== translationKey ? translated : client.kind;
            })()}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('clients.contactInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('clients.email')}</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
            )}

            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('clients.phone')}</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </div>
            )}

            {(client.address || client.city || client.postalCode || client.country) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('clients.address')}</p>
                  <div className="font-medium">
                    {client.address && <p>{client.address}</p>}
                    <p>
                      {[client.city, client.postalCode].filter(Boolean).join(', ')}
                    </p>
                    {client.country && <p>{client.country}</p>}
                  </div>
                </div>
              </div>
            )}

            {client.taxId && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('clients.taxId')}</p>
                  <p className="font-medium">{client.taxId}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>{t('clients.statistics')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('clients.totalOrders')}</p>
                  <p className="text-2xl font-bold">{client.totalOrders}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('clients.totalRevenue')}</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(Number(client.totalRevenue))}
                  </p>
                </div>
              </div>
            </div>

            {client.lastOrderDate && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('clients.lastOrder')}</p>
                    <p className="font-medium">
                      {format(new Date(client.lastOrderDate), 'PPP')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {client.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{t('clients.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Activity History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('clients.activityHistory')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
              <div className="shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{t('clients.clientCreated')}</p>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(client.createdAt), 'PPp')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('clients.accountInitialized')}
                </p>
              </div>
            </div>

            {client.updatedAt !== client.createdAt && (
              <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                <div className="shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{t('clients.informationUpdated')}</p>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(client.updatedAt), 'PPp')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('clients.profileModified')}
                  </p>
                </div>
              </div>
            )}

            {client.totalOrders === 0 && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                {t('clients.noActivityYet')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
