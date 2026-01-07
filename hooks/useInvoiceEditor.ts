'use client';

import { useEffect, useMemo, useState } from 'react';
import { Order, OrderItem } from '@/types';
import { invoicesApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface InvoiceLineInput {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  discount: number;
  notes?: string;
}

export interface InvoiceEditorState {
  clientId?: string;
  issueDate: string;
  dueDate: string;
  paymentTerms?: string;
  notes?: string;
  termsConditions?: string;
  items: InvoiceLineInput[];
}

function mapOrderItemsToInvoiceItems(order: Order): InvoiceLineInput[] {
  return order.items.map((item: OrderItem) => ({
    productId: item.productId,
    description: item.productName || item.description || 'Item',
    quantity: Number(item.quantity),
    unit: item.unit,
    unitPrice: Number(item.unitPrice),
    taxRate: 0,
    discount: 0,
    notes: item.notes,
  }));
}

export function useInvoiceEditor(initial?: Partial<InvoiceEditorState>, order?: Order) {
  const defaultItems = order ? mapOrderItemsToInvoiceItems(order) : initial?.items || [];

  const [state, setState] = useState<InvoiceEditorState>({
    clientId: initial?.clientId ?? order?.clientId,
    issueDate: initial?.issueDate ?? new Date().toISOString().slice(0, 10),
    dueDate:
      initial?.dueDate ??
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
        .toISOString()
        .slice(0, 10),
    paymentTerms: initial?.paymentTerms,
    notes: initial?.notes,
    termsConditions: initial?.termsConditions,
    items: defaultItems,
  });

  useEffect(() => {
    if (!order) return;
    setState((prev) => {
      const alreadySynced = prev.clientId === order.clientId && prev.items.length > 0;
      if (alreadySynced) return prev;
      return {
        ...prev,
        clientId: order.clientId,
        notes: prev.notes ?? order.notes ?? undefined,
        items: mapOrderItemsToInvoiceItems(order),
      };
    });
  }, [order?.id]);

  const totals = useMemo(() => {
    const subtotal = state.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = state.items.reduce((sum, item) => sum + item.discount, 0);
    const taxable = subtotal - discount;
    const tax = state.items.reduce((sum, item) => sum + (item.taxRate / 100) * (item.quantity * item.unitPrice - item.discount), 0);
    const total = taxable + tax;

    return {
      subtotal,
      discount,
      tax,
      total,
    };
  }, [state.items]);

  const addLine = () => {
    setState((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          quantity: 1,
          unit: 'unit',
          unitPrice: 0,
          taxRate: 0,
          discount: 0,
        },
      ],
    }));
  };

  const updateLine = (index: number, changes: Partial<InvoiceLineInput>) => {
    setState((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...changes };
      return { ...prev, items };
    });
  };

  const removeLine = (index: number) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  return {
    state,
    setState,
    totals,
    addLine,
    updateLine,
    removeLine,
  };
}

export function useInvoiceMutations() {
  const queryClient = useQueryClient();

  const createInvoice = useMutation({
    mutationFn: invoicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => invoicesApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
    },
  });

  const validateInvoice = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: { manualSequence?: number } }) =>
      invoicesApi.validate(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
    },
  });

  return { createInvoice, updateInvoice, validateInvoice };
}

