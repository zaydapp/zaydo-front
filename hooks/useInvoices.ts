import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api';
import { Invoice } from '@/types';

interface UseInvoicesParams {
  status?: string;
  clientId?: string;
  search?: string;
  enabled?: boolean;
}

export function useInvoices(params?: UseInvoicesParams) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesApi.getAll(params),
    enabled: params?.enabled !== false,
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ['invoices', 'stats'],
    queryFn: () => invoicesApi.getStats(),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesApi.getById(id!),
    enabled: !!id,
  });
}

