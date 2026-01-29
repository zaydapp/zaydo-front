'use client';

import { useCallback, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ordersApi, orderStatusesApi, productsApi } from '@/lib/api';
import { Order, OrderItem } from '@/types';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
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
  const [editableItems, setEditableItems] = useState<OrderItem[]>([]);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId),
  });

  const { data: orderStatuses, isLoading: statusesLoading } = useQuery({
    queryKey: ['order-statuses'],
    queryFn: () => orderStatusesApi.getAll(),
  });

  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productsApi.getAll({ take: 1000 }), // Fetch all products without pagination
  });

  // Initialize editable items when order data changes
  const getInitialEditableItems = useCallback(() => {
    return order?.items ? [...order.items] : [];
  }, [order]);

  // Initialize form values when order loads
  const getInitialFormValues = useCallback(() => {
    if (!order) {
      return { status: '', notes: '', deliveryDate: '' };
    }

    const statusValue = String((order.status as any)?.slug || 'DRAFT'); // eslint-disable-line @typescript-eslint/no-explicit-any
    return {
      status: statusValue,
      notes: order.notes || '',
      deliveryDate: order.deliveryDate ? format(new Date(order.deliveryDate), 'yyyy-MM-dd') : '',
    };
  }, [order]);

  // Update form values when order loads
  useEffect(() => {
    const values = getInitialFormValues();
    setStatus(values.status);
    setNotes(values.notes);
    setDeliveryDate(values.deliveryDate);
  }, [getInitialFormValues]);

  // Update editable items when order data changes
  useEffect(() => {
    setEditableItems(getInitialEditableItems());
  }, [getInitialEditableItems]);

  const updateItem = (index: number, field: keyof OrderItem, value: string) => {
    const updatedItems = [...editableItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Recalculate total price if quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = parseFloat(value) || 0;
      const unitPrice =
        parseFloat(
          field === 'quantity'
            ? String(updatedItems[index].unitPrice)
            : String(updatedItems[index].quantity)
        ) || 0;
      updatedItems[index].totalPrice = quantity * unitPrice;
    }

    setEditableItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = editableItems.filter((_, i) => i !== index);
    setEditableItems(updatedItems);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products?.data?.find((p) => p.id === productId);
    if (product) {
      const updatedItems = [...editableItems];
      updatedItems[index] = {
        ...updatedItems[index],
        productId,
        productName: product.name,
        unit: product.unit,
      };
      setEditableItems(updatedItems);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: {
      statusId: string | number;
      notes?: string;
      deliveryDate?: string;
      items?: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unit: string;
        price: number;
      }>;
    }) => ordersApi.update(orderId, data as any), // eslint-disable-line @typescript-eslint/no-explicit-any
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Commande mise à jour avec succès');
      router.push(`/dashboard/orders/${orderId}`);
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const handleSave = async () => {
    try {
      // Find the status ID based on slug
      type OrderStatusObj = {
        id: string;
        slug: string;
        name: string;
        color?: string;
        isSystem?: boolean;
      };
      const selectedStatus = (orderStatuses as OrderStatusObj[] | undefined)?.find(
        (s: OrderStatusObj) => s.slug === status
      );
      const statusId = selectedStatus?.id || status;

      await updateMutation.mutateAsync({
        statusId,
        notes,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        items: editableItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: Number(item.quantity),
          unit: item.unit,
          price: Number(item.unitPrice),
        })),
      });
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const getStatusIcon = (statusSlug: string) => {
    type OrderStatusObj = {
      id: string;
      slug: string;
      name: string;
      color?: string;
      isSystem?: boolean;
    };
    const statusObj = (orderStatuses as OrderStatusObj[] | undefined)?.find(
      (s: OrderStatusObj) => s.slug === statusSlug
    );
    if (statusSlug === 'delivered') return <CheckCircle2 className="h-5 w-5" />;
    if (statusSlug === 'cancelled') return <XCircle className="h-5 w-5" />;
    if (statusSlug === 'processing') return <Clock className="h-5 w-5" />;
    return null;
  };

  const getStatusColor = (statusSlug: string) => {
    type OrderStatusObj = {
      id: string;
      slug: string;
      name: string;
      color?: string;
      isSystem?: boolean;
    };
    const statusObj = (orderStatuses as OrderStatusObj[] | undefined)?.find(
      (s: OrderStatusObj) => s.slug === statusSlug
    );
    if (statusObj?.color) {
      return `text-white`; // Will be applied via inline style
    }
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return colors[statusSlug] || colors.pending;
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
        <Button variant="outline" size="sm" onClick={() => router.back()}>
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
                      <SelectValue
                        placeholder={t('orders.selectStatus') || 'Sélectionner un statut'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatuses?.map(
                        (st: {
                          id: string;
                          slug: string;
                          name: string;
                          color?: string;
                          isSystem?: boolean;
                        }) => (
                          <SelectItem key={st.id} value={st.slug}>
                            <span className="flex items-center gap-2">
                              {getStatusIcon(st.slug)}
                              {st.isSystem
                                ? t(`orderStatuses.systemStatuses.${st.slug}`) || st.name
                                : st.name}
                            </span>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
                {status && (
                  <div
                    className={`p-3 rounded-lg ${getStatusColor(status)}`}
                    style={{
                      backgroundColor:
                        ((
                          orderStatuses as Array<{ slug: string; color?: string }> | undefined
                        )?.find((s) => s.slug === status)?.color || '') + '20',
                      color: (
                        orderStatuses as Array<{ slug: string; color?: string }> | undefined
                      )?.find((s) => s.slug === status)?.color,
                      borderColor: (
                        orderStatuses as Array<{ slug: string; color?: string }> | undefined
                      )?.find((s) => s.slug === status)?.color,
                      borderWidth: '1px',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="font-medium">
                        {(() => {
                          const currentStatus = (
                            orderStatuses as
                              | Array<{ slug: string; isSystem?: boolean; name: string }>
                              | undefined
                          )?.find((s) => s.slug === status);
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
              <div className="flex items-center justify-between">
                <CardTitle>Articles</CardTitle>
                <Button
                  onClick={() => {
                    const newItem: OrderItem = {
                      id: `temp-${Date.now()}`,
                      orderId: orderId,
                      productId: '',
                      productName: '',
                      quantity: 1,
                      unit: '',
                      unitPrice: 0,
                      totalPrice: 0,
                    };
                    setEditableItems([...editableItems, newItem]);
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un article
                </Button>
              </div>
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editableItems?.map((item: OrderItem, index: number) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-2">
                            <SearchableSelect
                              value={item.productId}
                              onValueChange={(value) => handleProductSelect(index, value)}
                              options={
                                products?.data?.map((product) => ({
                                  value: product.id,
                                  label: `${product.name} (${product.unit})`,
                                })) || []
                              }
                              placeholder="Rechercher un produit..."
                              searchPlaceholder="Rechercher..."
                              emptyText="Aucun produit trouvé"
                            />
                            {/* {item.productName && (
                              <p className="text-sm text-muted-foreground">
                                Sélectionné: {item.productName} - Unité: {item.unit}
                              </p>
                            )} */}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              className="w-20 text-right"
                              min="0"
                              step="0.01"
                            />
                            <span className="text-sm text-muted-foreground">{item.unit}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                            className="w-24 text-right"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(item.totalPrice))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={3} className="text-right">
                        Total:
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          editableItems.reduce((sum, item) => sum + Number(item.totalPrice), 0)
                        )}
                      </TableCell>
                      <TableCell></TableCell>
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
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(
                    editableItems.reduce((sum, item) => sum + Number(item.totalPrice), 0)
                  )}
                </p>
                {editableItems.reduce((sum, item) => sum + Number(item.totalPrice), 0) !==
                  Number(order.totalAmount) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Original: {formatCurrency(Number(order.totalAmount))}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
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
