'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ordersApi, orderStatusesApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useCurrency } from '@/hooks/use-currency';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function EditOrderPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;
  const { format: formatCurrency } = useCurrency();

  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId),
  });

  const { data: orderStatuses, isLoading: statusesLoading } = useQuery({
    queryKey: ['order-statuses'],
    queryFn: () => orderStatusesApi.getAll(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => ordersApi.update(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Commande mise à jour avec succès');
      router.push(`/dashboard/orders/${orderId}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  // Initialize form when order loads
  const [isInitialized, setIsInitialized] = useState(false);
  if (order && !isInitialized) {
    const statusValue = typeof order.status === 'string' ? order.status : (order.status as any)?.slug || 'DRAFT';
    setStatus(statusValue);
    setNotes(order.notes || '');
    setDeliveryDate(order.deliveryDate ? format(new Date(order.deliveryDate), 'yyyy-MM-dd') : '');
    setIsInitialized(true);
  }

  const handleSave = async () => {
    try {
      // Find the status ID based on slug
      const selectedStatus = orderStatuses?.find((s: any) => s.slug === status);
      const statusId = selectedStatus?.id || status;

      await updateMutation.mutateAsync({
        statusId,
        notes,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
      });
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const getStatusIcon = (statusSlug: string) => {
    const statusObj = orderStatuses?.find((s: any) => s.slug === statusSlug);
    if (statusSlug === 'COMPLETED') return <CheckCircle2 className="h-5 w-5" />;
    if (statusSlug === 'CANCELLED') return <XCircle className="h-5 w-5" />;
    if (statusSlug === 'IN_PROGRESS') return <Clock className="h-5 w-5" />;
    return null;
  };

  const getStatusColor = (statusSlug: string) => {
    const statusObj = orderStatuses?.find((s: any) => s.slug === statusSlug);
    if (statusObj?.color) {
      return `text-white`; // Will be applied via inline style
    }
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return colors[statusSlug] || colors.DRAFT;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Commande introuvable</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            {order.type === 'CLIENT_ORDER' ? 'Commande Client' : 'Commande Fournisseur'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Edit Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Statut de la Commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                {statusesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('orders.selectStatus') || 'Sélectionner un statut'} />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatuses?.map((st: any) => (
                        <SelectItem key={st.id} value={st.slug}>
                          <span className="flex items-center gap-2">
                            {getStatusIcon(st.slug)}
                            {st.isSystem ? t(`orderStatuses.systemStatuses.${st.slug}`) || st.name : st.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {status && (
                  <div 
                    className={`p-3 rounded-lg ${getStatusColor(status)}`}
                    style={{
                      backgroundColor: orderStatuses?.find((s: any) => s.slug === status)?.color + '20',
                      color: orderStatuses?.find((s: any) => s.slug === status)?.color,
                      borderColor: orderStatuses?.find((s: any) => s.slug === status)?.color,
                      borderWidth: '1px',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="font-medium">
                        {(() => {
                          const currentStatus = orderStatuses?.find((s: any) => s.slug === status);
                          return currentStatus?.isSystem 
                            ? t(`orderStatuses.systemStatuses.${status}`) || currentStatus.name
                            : currentStatus?.name || status;
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Date */}
          <Card>
            <CardHeader>
              <CardTitle>Date de Livraison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Date prévue de livraison</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
                {order.deliveryDate && (
                  <p className="text-sm text-muted-foreground">
                    Ancienne date: {format(new Date(order.deliveryDate), 'dd/MM/yyyy')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes additionnelles</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajouter des notes sur cette commande..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead className="text-right">Prix Unitaire</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {order?.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(item.unitPrice))}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(Number(item.totalPrice))}</TableCell>
                        </TableRow>
                      ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={3} className="text-right">Total:</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(order.totalAmount))}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant={order.type === 'CLIENT_ORDER' ? 'default' : 'secondary'}>
                  {order.type === 'CLIENT_ORDER' ? 'Client' : 'Fournisseur'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de Commande</p>
                <p className="font-medium">{format(new Date(order.orderDate), 'dd/MM/yyyy')}</p>
              </div>
              {order.client && (
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{order.client.name}</p>
                </div>
              )}
              {order.supplier && (
                <div>
                  <p className="text-sm text-muted-foreground">Fournisseur</p>
                  <p className="font-medium">{order.supplier.name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Montant Total</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(Number(order.totalAmount))}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="w-full"
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer les modifications
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/orders/${orderId}`)}
                className="w-full"
              >
                Annuler
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
