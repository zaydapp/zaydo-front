'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';

export function useOrder(orderId?: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId as string),
    enabled: !!orderId,
  });
}
