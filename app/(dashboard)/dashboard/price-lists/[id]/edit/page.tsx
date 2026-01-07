'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { priceListsApi, productsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface PriceListItemForm {
  productId: string;
  productName?: string;
  price: number;
}

export default function EditPriceListPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const priceListId = params?.id;

  const [name, setName] = useState('');
  const [type, setType] = useState('RETAIL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');
  const [clientGroup, setClientGroup] = useState('');
  const [items, setItems] = useState<PriceListItemForm[]>([]);

  const { data: priceList, isLoading: isLoadingPriceList } = useQuery({
    queryKey: ['price-lists', priceListId],
    queryFn: () => priceListsApi.getById(priceListId as string),
    enabled: Boolean(priceListId),
  });

  const { data: productsResponse } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll({ take: 1000 }),
  });

  const products = productsResponse?.data || [];

  useEffect(() => {
    if (!priceList) return;

    setName(priceList.name || '');
    setType(priceList.type || 'RETAIL');
    setStartDate(priceList.startDate ? new Date(priceList.startDate).toISOString().split('T')[0] : '');
    setEndDate(priceList.endDate ? new Date(priceList.endDate).toISOString().split('T')[0] : '');
    setIsActive(Boolean(priceList.isActive));
    setDescription(priceList.description || '');
    setClientGroup(priceList.clientGroup || '');
    setItems(
      priceList.items?.map((item: any) => ({
        productId: item.productId,
        productName: item.product?.name || item.productName,
        price: item.price,
      })) || []
    );
  }, [priceList]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => priceListsApi.update(priceListId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      queryClient.invalidateQueries({ queryKey: ['price-lists', priceListId] });
      toast.success(t('priceLists.updateSuccess') || 'Price list updated successfully');
      router.push(`/dashboard/price-lists/${priceListId}`);
    },
    onError: () => {
      toast.error(t('priceLists.updateError') || 'Failed to update price list');
    },
  });

  const addItem = () => {
    setItems([...items, { productId: '', price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PriceListItemForm, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'productId') {
      const product = products.find((p: any) => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
      }
    }

    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!priceListId) return;

    if (!name || !startDate || items.length === 0) {
      toast.error(t('priceLists.validationError') || 'Please fill in all required fields');
      return;
    }

    if (items.some((item) => !item.productId || item.price <= 0)) {
      toast.error(t('priceLists.itemsValidationError') || 'All items must have a product and valid price');
      return;
    }

    updateMutation.mutate({
      name,
      type,
      startDate,
      endDate: endDate || undefined,
      isActive,
      description: description || undefined,
      clientGroup: clientGroup || undefined,
      items: items.map(({ productId, price }) => ({ productId, price })),
    });
  };

  const productOptions = useMemo(
    () =>
      products.map((product: any) => ({
        value: product.id,
        label: `${product.name} (${product.unit})`,
      })),
    [products]
  );

  if (isLoadingPriceList) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t('priceLists.loadingPriceList') || 'Loading price list...'}</div>
      </div>
    );
  }

  if (!priceList) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-destructive">
          {t('priceLists.loadError') || 'Failed to load price list.'}
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard/price-lists')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('priceLists.backToList') || 'Back to price lists'}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {t('priceLists.editPriceList') || 'Edit Price List'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {priceList.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('priceLists.basicInfo') || 'Basic Information'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('priceLists.name') || 'Name'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('priceLists.namePlaceholder') || 'e.g., Summer 2025, Wholesale Q4'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">{t('priceLists.type') || 'Type'}</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RETAIL">Retail</SelectItem>
                    <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                    <SelectItem value="PROMOTIONAL">Promotional</SelectItem>
                    <SelectItem value="SEASONAL">Seasonal</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('priceLists.description') || 'Description'}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('priceLists.descriptionPlaceholder') || 'Optional description...'}
                rows={2}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  {t('priceLists.startDate') || 'Start Date'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">{t('priceLists.endDate') || 'End Date'}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
                <p className="text-xs text-muted-foreground">
                  {t('priceLists.endDateHint') || 'Leave empty for no end date'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isActive">{t('priceLists.active') || 'Active'}</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    {isActive ? t('common.yes') || 'Yes' : t('common.no') || 'No'}
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientGroup">{t('priceLists.clientGroup') || 'Client Group'}</Label>
              <Input
                id="clientGroup"
                value={clientGroup}
                onChange={(e) => setClientGroup(e.target.value)}
                placeholder={t('priceLists.clientGroupPlaceholder') || 'Optional: for future segmentation'}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('priceLists.productsAndPrices') || 'Products & Prices'}</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                {t('priceLists.addProduct') || 'Add Product'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  {t('priceLists.noProducts') || 'No products added yet'}
                </p>
                <Button type="button" variant="outline" className="mt-4" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('priceLists.addFirstProduct') || 'Add First Product'}
                </Button>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-1 space-y-2">
                    <Label>
                      {t('priceLists.product') || 'Product'} <span className="text-destructive">*</span>
                    </Label>
                    <SearchableSelect
                      value={item.productId}
                      onValueChange={(value) => updateItem(index, 'productId', value)}
                      options={productOptions}
                      placeholder={t('priceLists.selectProduct') || 'Select product...'}
                      searchPlaceholder={t('common.search') || 'Search...'}
                      emptyText={t('common.noResults') || 'No products found'}
                    />
                  </div>

                  <div className="w-48 space-y-2">
                    <Label>
                      {t('priceLists.price') || 'Price'} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder={t('priceLists.pricePlaceholder') || '0.00'}
                      required
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="mt-8"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending
              ? t('common.saving') || 'Saving...'
              : t('priceLists.updatePriceList') || 'Update Price List'}
          </Button>
        </div>
      </form>
    </div>
  );
}

