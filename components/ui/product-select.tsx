'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  products: Array<{ id: string; name: string; sku?: string }>;
  placeholder?: string;
  className?: string;
}

export function ProductSelect({
  value,
  onValueChange,
  products,
  placeholder = 'Select product...',
  className,
}: ProductSelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(search.toLowerCase()))
    );
  }, [products, search]);

  const selectedProduct = products.find((p) => p.id === value);

  const handleSelect = (productId: string) => {
    onValueChange(productId);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onValueChange('');
    setSearch('');
  };

  return (
    <div className="relative">
      <Select
        value={value}
        onValueChange={handleSelect}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className={cn('w-full h-9', className)}>
          <SelectValue placeholder={placeholder}>
            {selectedProduct ? (
              <div className="flex items-center gap-2">
                <span className="truncate">{selectedProduct.name}</span>
                {selectedProduct.sku && (
                  <span className="text-xs text-muted-foreground">
                    ({selectedProduct.sku})
                  </span>
                )}
              </div>
            ) : (
              placeholder
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <div className="sticky top-0 z-10 bg-popover border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-[250px] overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No products found
              </div>
            ) : (
              filteredProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex items-center gap-2">
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === product.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate flex-1">{product.name}</span>
                    {product.sku && (
                      <span className="text-xs text-muted-foreground">
                        SKU: {product.sku}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      )}
    </div>
  );
}
