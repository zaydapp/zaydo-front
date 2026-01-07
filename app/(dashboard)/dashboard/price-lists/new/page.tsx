'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { priceListsApi, productsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, Calendar, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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

interface PriceListItem {
  productId: string;
  productName?: string;
  price: number;
}

export default function NewPriceListPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [type, setType] = useState('RETAIL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');
  const [clientGroup, setClientGroup] = useState('');
  const [items, setItems] = useState<PriceListItem[]>([]);

  const { data: productsResponse } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll({ take: 1000 }),
  });

  const products = Array.isArray(productsResponse?.data) ? productsResponse.data : [];

  const createMutation = useMutation({
    mutationFn: priceListsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      toast.success(t('priceLists.createSuccess') || 'Price list created successfully');
      router.push('/dashboard/price-lists');
    },
    onError: () => {
      toast.error(t('priceLists.createError') || 'Failed to create price list');
    },
  });

  const addItem = () => {
    setItems([...items, { productId: '', price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PriceListItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If product is selected, add product name
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

    if (!name || !startDate || items.length === 0) {
      toast.error(t('priceLists.validationError') || 'Please fill in all required fields');
      return;
    }

    // Validate all items have product and price
    if (items.some(item => !item.productId || item.price <= 0)) {
      toast.error(t('priceLists.itemsValidationError') || 'All items must have a product and valid price');
      return;
    }

    createMutation.mutate({
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

  const productOptions = products.map((product: any) => ({
    value: product.id,
    label: `${product.name} (${product.unit})`,
  }));

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {t('priceLists.newPriceList') || 'New Price List'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('priceLists.newDescription') || 'Create a new price list for specific period'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
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

        {/* Products & Prices */}
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
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createMutation.isPending
              ? t('common.saving') || 'Saving...'
              : t('common.save') || 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}
