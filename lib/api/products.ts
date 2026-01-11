import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from './index';
import { Product, StockMovement } from '@/types';

// React Query hooks for Products
export const useProducts = (params?: {
  search?: string;
  type?: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
  skip?: number;
  take?: number;
}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.getAll(params),
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
};

export const useProductStats = () => {
  return useQuery({
    queryKey: ['products', 'stats'],
    queryFn: () => productsApi.getStats(),
  });
};

export const useLowStockProducts = () => {
  return useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: () => productsApi.getLowStock(),
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Product>) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useStockMovements = (params?: {
  productId?: string;
  skip?: number;
  take?: number;
}) => {
  return useQuery({
    queryKey: ['stock-movements', params],
    queryFn: () => productsApi.getStockMovements(params),
  });
};

export const useAddStockMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<StockMovement>) => productsApi.addStockMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
};
