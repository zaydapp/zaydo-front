'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  ordersApi,
  clientsApi,
  suppliersApi,
  productsApi,
  priceListsApi,
  orderStatusesApi,
} from '@/lib/api';
import { Product, Client, Supplier } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingCart,
  TrendingDown,
  UserPlus,
  Building2,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';

type OrderType = 'CLIENT_ORDER' | 'SUPPLIER_ORDER';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  notes?: string;
}

export default function NewOrderPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [orderType, setOrderType] = useState<OrderType>('CLIENT_ORDER');
  const [statusId, setStatusId] = useState('');
  const [clientId, setClientId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([
    { productId: '', productName: '', quantity: 1, unit: '', unitPrice: 0, notes: '' },
  ]);

  // Dialog states
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');

  const steps = [
    { number: 1, title: t('orders.selectType'), description: t('orders.chooseOrderType') },
    { number: 2, title: t('orders.basicInformation'), description: t('orders.enterBasicDetails') },
    { number: 3, title: t('orders.orderItems'), description: t('orders.addOrderItems') },
    { number: 4, title: t('orders.review'), description: t('orders.reviewOrder') },
  ];

  // Fetch clients, suppliers, and products
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll({ take: 999 }),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll({ take: 999 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll({ take: 999 }),
  });

  const { data: statusesData = [] } = useQuery({
    queryKey: ['order-statuses'],
    queryFn: orderStatusesApi.getAll,
  });

  const clients = clientsData?.data || [];
  const suppliers = suppliersData?.data || [];
  const products = productsData?.data || ([] as Product[]);
  const statuses = statusesData
    .filter((s: { isActive?: boolean }) => s.isActive)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setClientId(data.id);
      setIsClientDialogOpen(false);
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPhone('');
      toast.success(t('clients.clientCreated'));
    },
    onError: () => {
      toast.error(t('clients.createError'));
    },
  });

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setSupplierId(data.id);
      setIsSupplierDialogOpen(false);
      setNewSupplierName('');
      setNewSupplierEmail('');
      setNewSupplierPhone('');
      toast.success(t('suppliers.supplierCreated'));
    },
    onError: () => {
      toast.error(t('suppliers.createError'));
    },
  });

  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(t('orders.orderCreated'));
      router.push('/dashboard/orders');
    },
    onError: () => {
      toast.error(t('orders.createError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!statusId) {
      toast.error(t('orders.selectStatus') || 'Please select a status');
      return;
    }
    if (orderType === 'CLIENT_ORDER' && !clientId) {
      toast.error(t('orders.selectClient'));
      return;
    }
    if (orderType === 'SUPPLIER_ORDER' && !supplierId) {
      toast.error(t('orders.selectSupplier'));
      return;
    }
    if (
      items.length === 0 ||
      items.some((item) => !item.productId || item.quantity <= 0 || item.unitPrice <= 0)
    ) {
      toast.error(t('orders.invalidItems'));
      return;
    }

    createMutation.mutate({
      type: orderType,
      clientId: orderType === 'CLIENT_ORDER' ? clientId : undefined,
      supplierId: orderType === 'SUPPLIER_ORDER' ? supplierId : undefined,
      orderDate,
      deliveryDate: deliveryDate || undefined,
      notes,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        notes: item.notes,
      })),
    });
  };

  const addItem = () => {
    setItems([
      ...items,
      { productId: '', productName: '', quantity: 1, unit: '', unitPrice: 0, notes: '' },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: OrderItem[keyof OrderItem]) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleProductSelect = async (index: number, productId: string) => {
    console.log('handleProductSelect called', { index, productId, products });
    const product = products.find((p: Product) => p.id === productId);
    console.log('Found product:', product);
    if (product) {
      let defaultPrice = 0;

      // For client orders, try to get price from active price list first
      if (orderType === 'CLIENT_ORDER') {
        try {
          const priceData = await priceListsApi.getProductPrice(
            productId,
            orderDate || new Date().toISOString()
          );
          console.log('Price data from API:', priceData);

          // The API returns the price directly (number or string) or null
          if (priceData !== null && priceData !== undefined) {
            defaultPrice = parseFloat(priceData as unknown as string) || 0;
            console.log('Got price from price list:', defaultPrice);
          } else {
            // Fallback to product selling price
            const prodWithPrices = product as Product & { sellingPrice?: number };
            defaultPrice = prodWithPrices.sellingPrice || 0;
            console.log('No price list data, using product selling price:', defaultPrice);
          }
        } catch (error) {
          console.error('Error fetching price from price list:', error);
          // If no price list found, use product selling price
          const prodWithPrices = product as Product & { sellingPrice?: number };
          defaultPrice = prodWithPrices.sellingPrice || 0;
          console.log('Fallback to product selling price:', defaultPrice);
        }
      } else {
        // For supplier orders, use purchase price
        const prodWithPrices = product as Product & { purchasePrice?: number };
        defaultPrice = prodWithPrices.purchasePrice || 0;
        console.log('Using product purchase price:', defaultPrice);
      }

      console.log('Updating item with:', {
        productId,
        productName: product.name,
        unit: product.unit,
        unitPrice: defaultPrice,
      });
      // Update all fields at once to avoid race conditions
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        productId,
        productName: product.name,
        unit: product.unit,
        unitPrice: defaultPrice,
      };
      console.log('New items array:', newItems);
      setItems(newItems);
    } else {
      console.log('Product not found in products array');
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const canProceedToNextStep = () => {
    if (currentStep === 1) return true;
    if (currentStep === 2) {
      if (orderType === 'CLIENT_ORDER') return !!clientId;
      if (orderType === 'SUPPLIER_ORDER') return !!supplierId;
    }
    if (currentStep === 3) {
      return (
        items.length > 0 &&
        items.every((item) => item.productId && item.quantity > 0 && item.unitPrice > 0)
      );
    }
    return true;
  };

  const nextStep = () => {
    if (canProceedToNextStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      if (currentStep === 2) {
        toast.error(
          orderType === 'CLIENT_ORDER' ? t('orders.selectClient') : t('orders.selectSupplier')
        );
      } else if (currentStep === 3) {
        toast.error(t('orders.invalidItems'));
      }
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('orders.addOrder')}</h1>
          <p className="text-muted-foreground mt-1">{t('orders.addOrderDescription')}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                      currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : currentStep === step.number
                          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
                  </div>
                  <div className="text-center hidden md:block">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-2 transition-all',
                      currentStep > step.number ? 'bg-green-500' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Order Type Selection */}
        {currentStep === 1 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>{t('orders.selectType')}</CardTitle>
              <CardDescription>{t('orders.chooseOrderType')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() => setOrderType('CLIENT_ORDER')}
                  className={cn(
                    'relative flex flex-col items-center gap-4 p-8 rounded-xl border-2 transition-all',
                    orderType === 'CLIENT_ORDER'
                      ? 'border-green-500 bg-green-500/5 shadow-lg scale-105'
                      : 'border-border hover:border-green-500/50 hover:bg-accent/50'
                  )}
                >
                  {orderType === 'CLIENT_ORDER' && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-green-500 text-white rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-full p-4',
                      orderType === 'CLIENT_ORDER' ? 'bg-green-500/10' : 'bg-muted'
                    )}
                  >
                    <ShoppingCart
                      className={cn(
                        'h-8 w-8',
                        orderType === 'CLIENT_ORDER' ? 'text-green-500' : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className={cn(
                        'text-lg font-semibold',
                        orderType === 'CLIENT_ORDER' ? 'text-green-600' : 'text-foreground'
                      )}
                    >
                      {t('orders.client_order')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('orders.clientOrderDescription')}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('SUPPLIER_ORDER')}
                  className={cn(
                    'relative flex flex-col items-center gap-4 p-8 rounded-xl border-2 transition-all',
                    orderType === 'SUPPLIER_ORDER'
                      ? 'border-orange-500 bg-orange-500/5 shadow-lg scale-105'
                      : 'border-border hover:border-orange-500/50 hover:bg-accent/50'
                  )}
                >
                  {orderType === 'SUPPLIER_ORDER' && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-orange-500 text-white rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-full p-4',
                      orderType === 'SUPPLIER_ORDER' ? 'bg-orange-500/10' : 'bg-muted'
                    )}
                  >
                    <TrendingDown
                      className={cn(
                        'h-8 w-8',
                        orderType === 'SUPPLIER_ORDER' ? 'text-orange-500' : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className={cn(
                        'text-lg font-semibold',
                        orderType === 'SUPPLIER_ORDER' ? 'text-orange-600' : 'text-foreground'
                      )}
                    >
                      {t('orders.supplier_order')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('orders.supplierOrderDescription')}
                    </p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Basic Information */}
        {currentStep === 2 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>{t('orders.basicInformation')}</CardTitle>
              <CardDescription>{t('orders.enterBasicDetails')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orderType === 'CLIENT_ORDER' ? (
                  <div className="space-y-2">
                    <Label htmlFor="clientId">{t('orders.selectClient')} *</Label>
                    <div className="flex gap-2">
                      <SearchableSelect
                        value={clientId}
                        onValueChange={setClientId}
                        options={clients.map((client: Client) => ({
                          value: client.id,
                          label: client.name,
                        }))}
                        placeholder={t('orders.chooseClient')}
                        searchPlaceholder={t('common.search')}
                        emptyText={t('clients.noClients')}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-10 w-10"
                        onClick={() => setIsClientDialogOpen(true)}
                        title={t('clients.addClient')}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="supplierId">{t('orders.selectSupplier')} *</Label>
                    <div className="flex gap-2">
                      <SearchableSelect
                        value={supplierId}
                        onValueChange={setSupplierId}
                        options={suppliers.map((supplier: Supplier) => ({
                          value: supplier.id,
                          label: supplier.name,
                        }))}
                        placeholder={t('orders.chooseSupplier')}
                        searchPlaceholder={t('common.search')}
                        emptyText={t('suppliers.noSuppliers')}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-10 w-10"
                        onClick={() => setIsSupplierDialogOpen(true)}
                        title={t('suppliers.addSupplier')}
                      >
                        <Building2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="statusId">{t('orders.statusLabel')} *</Label>
                  <SearchableSelect
                    value={statusId}
                    onValueChange={setStatusId}
                    options={statuses.map(
                      (status: { id: string; isSystem?: boolean; slug: string; name: string }) => ({
                        value: status.id,
                        label: status.isSystem
                          ? t(`orderStatuses.systemStatuses.${status.slug}`)
                          : status.name,
                      })
                    )}
                    placeholder={t('orders.selectStatus')}
                    searchPlaceholder={t('common.search')}
                    emptyText={t('orderStatuses.noStatuses')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderDate">{t('orders.orderDate')} *</Label>
                  <Input
                    id="orderDate"
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">{t('orders.deliveryDate')}</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('orders.notes')}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('orders.notesPlaceholder')}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Order Items */}
        {currentStep === 3 && (
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('orders.orderItems')}</CardTitle>
                <CardDescription>{t('orders.addOrderItems')}</CardDescription>
              </div>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('orders.addItem')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">
                      {t('orders.item')} {index + 1}
                    </Label>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="h-8 w-8 p-0 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>{t('orders.product')} *</Label>
                      <SearchableSelect
                        value={item.productId}
                        onValueChange={(value) => {
                          console.log('Product selected:', value);
                          handleProductSelect(index, value);
                        }}
                        options={products.map((product: Product) => ({
                          value: product.id,
                          label: `${product.name} (${product.unit})`,
                        }))}
                        placeholder={t('orders.chooseProduct')}
                        searchPlaceholder={t('common.search')}
                        emptyText={t('products.noProducts')}
                      />
                      {item.productName && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {item.productName} - Unit: {item.unit}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>{t('orders.quantity')} *</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('orders.unitPrice')} *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>{t('orders.lineTotal')}</Label>
                      <Input
                        value={new Intl.NumberFormat('fr-TN', {
                          style: 'currency',
                          currency: 'TND',
                        }).format(item.quantity * item.unitPrice)}
                        disabled
                        className="bg-muted font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>{t('orders.review')}</CardTitle>
                <CardDescription>{t('orders.reviewOrder')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Type */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {orderType === 'CLIENT_ORDER' ? (
                      <>
                        <ShoppingCart className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">{t('orders.type')}</p>
                          <p className="font-semibold">{t('orders.client_order')}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">{t('orders.type')}</p>
                          <p className="font-semibold">{t('orders.supplier_order')}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                    {t('common.edit')}
                  </Button>
                </div>

                {/* Client/Supplier */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {orderType === 'CLIENT_ORDER' ? t('clients.client') : t('suppliers.supplier')}
                    </p>
                    <p className="font-semibold">
                      {orderType === 'CLIENT_ORDER'
                        ? clients.find((c) => c.id === clientId)?.name
                        : suppliers.find((s) => s.id === supplierId)?.name}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                    {t('common.edit')}
                  </Button>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('orders.orderDate')}</p>
                    <p className="font-semibold">{new Date(orderDate).toLocaleDateString()}</p>
                  </div>
                  {deliveryDate && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('orders.deliveryDate')}</p>
                      <p className="font-semibold">{new Date(deliveryDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{t('orders.orderItems')}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(3)}
                    >
                      {t('common.edit')}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit} ×{' '}
                            {new Intl.NumberFormat('fr-TN', {
                              style: 'currency',
                              currency: 'TND',
                            }).format(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {new Intl.NumberFormat('fr-TN', {
                            style: 'currency',
                            currency: 'TND',
                          }).format(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                  <p className="text-lg font-semibold">{t('orders.total')}</p>
                  <p className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat('fr-TN', {
                      style: 'currency',
                      currency: 'TND',
                    }).format(calculateTotal())}
                  </p>
                </div>

                {notes && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">{t('orders.notes')}</p>
                    <p className="whitespace-pre-wrap">{notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3 sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t rounded-lg">
          <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('common.previous')}
          </Button>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              {t('common.cancel')}
            </Button>

            {currentStep < 4 ? (
              <Button type="button" onClick={nextStep}>
                {t('common.next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={createMutation.isPending} className="min-w-[120px]">
                {createMutation.isPending ? t('common.creating') : t('orders.createOrder')}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Create Client Dialog */}
      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('clients.addClient')}</DialogTitle>
            <DialogDescription>{t('clients.addClientDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newClientName">{t('clients.name')} *</Label>
              <Input
                id="newClientName"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder={t('clients.enterName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newClientEmail">{t('clients.email')}</Label>
              <Input
                id="newClientEmail"
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder={t('clients.enterEmail')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newClientPhone">{t('clients.phone')}</Label>
              <Input
                id="newClientPhone"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder={t('clients.enterPhone')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsClientDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (!newClientName.trim()) {
                  toast.error(t('clients.nameRequired'));
                  return;
                }
                createClientMutation.mutate({
                  name: newClientName,
                  email: newClientEmail || undefined,
                  phone: newClientPhone || undefined,
                });
              }}
              disabled={createClientMutation.isPending}
            >
              {createClientMutation.isPending ? t('common.creating') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Supplier Dialog */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('suppliers.addSupplier')}</DialogTitle>
            <DialogDescription>{t('suppliers.addSupplierDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newSupplierName">{t('suppliers.name')} *</Label>
              <Input
                id="newSupplierName"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder={t('suppliers.enterName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newSupplierEmail">{t('suppliers.email')}</Label>
              <Input
                id="newSupplierEmail"
                type="email"
                value={newSupplierEmail}
                onChange={(e) => setNewSupplierEmail(e.target.value)}
                placeholder={t('suppliers.enterEmail')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newSupplierPhone">{t('suppliers.phone')}</Label>
              <Input
                id="newSupplierPhone"
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
                placeholder={t('suppliers.enterPhone')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsSupplierDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (!newSupplierName.trim()) {
                  toast.error(t('suppliers.nameRequired'));
                  return;
                }
                createSupplierMutation.mutate({
                  name: newSupplierName,
                  email: newSupplierEmail || undefined,
                  phone: newSupplierPhone || undefined,
                });
              }}
              disabled={createSupplierMutation.isPending}
            >
              {createSupplierMutation.isPending ? t('common.creating') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
