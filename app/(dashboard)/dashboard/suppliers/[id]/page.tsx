'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { suppliersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Mail, Phone, MapPin, FileText, Calendar, DollarSign, Package, Edit, AlertCircle, Truck, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/use-currency';
import { format } from 'date-fns';

export default function SupplierDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id as string;
  const { format: formatCurrency } = useCurrency();

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => suppliersApi.getById(supplierId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Truck className="h-12 w-12 animate-pulse text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">{t('suppliers.notFound')}</p>
          <Button onClick={() => router.push('/dashboard/suppliers')}>
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
            onClick={() => router.push('/dashboard/suppliers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{supplier.name}</h1>
            <p className="text-muted-foreground">
              {t('suppliers.supplierDetails')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/suppliers/${supplier.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
          <Badge variant={supplier.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {t(`suppliers.${supplier.status.toLowerCase()}`)}
          </Badge>
          <Badge variant="outline">
            {(() => {
              const valueKey = supplier.type.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const translationKey = `settings.settingValues.suppliers.${valueKey}`;
              const translated = t(translationKey);
              return translated !== translationKey ? translated : supplier.type;
            })()}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('suppliers.contactInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.contactPerson && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('suppliers.contactPerson')}</p>
                  <p className="font-medium">{supplier.contactPerson}</p>
                </div>
              </div>
            )}

            {supplier.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('suppliers.email')}</p>
                  <p className="font-medium">{supplier.email}</p>
                </div>
              </div>
            )}

            {supplier.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('suppliers.phone')}</p>
                  <p className="font-medium">{supplier.phone}</p>
                </div>
              </div>
            )}

            {(supplier.address || supplier.city || supplier.postalCode || supplier.country) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('suppliers.address')}</p>
                  <div className="font-medium">
                    {supplier.address && <p>{supplier.address}</p>}
                    <p>
                      {[supplier.city, supplier.postalCode].filter(Boolean).join(', ')}
                    </p>
                    {supplier.country && <p>{supplier.country}</p>}
                  </div>
                </div>
              </div>
            )}

            {supplier.taxId && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('suppliers.taxId')}</p>
                  <p className="font-medium">{supplier.taxId}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>{t('suppliers.statistics')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('suppliers.totalOrders')}</p>
                  <p className="text-2xl font-bold">{supplier.totalOrders}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('suppliers.totalSpent')}</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(Number(supplier.totalSpent))}
                  </p>
                </div>
              </div>
            </div>

            {supplier.lastOrderDate && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('suppliers.lastOrder')}</p>
                    <p className="font-medium">
                      {format(new Date(supplier.lastOrderDate), 'PPP')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {supplier.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{t('suppliers.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{supplier.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Activity History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('suppliers.activityHistory')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
              <div className="shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{t('suppliers.supplierCreated')}</p>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(supplier.createdAt), 'PPp')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('suppliers.accountInitialized')}
                </p>
              </div>
            </div>

            {supplier.updatedAt !== supplier.createdAt && (
              <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                <div className="shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{t('suppliers.informationUpdated')}</p>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(supplier.updatedAt), 'PPp')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('suppliers.profileModified')}
                  </p>
                </div>
              </div>
            )}

            {supplier.totalOrders === 0 && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                {t('suppliers.noActivityYet')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
