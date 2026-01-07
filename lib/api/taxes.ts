import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxesApi } from './index';

export interface Tax {
  id: string;
  name: string;
  rate: number;
  code?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// React Query hooks for Taxes
export const useTaxes = (activeOnly: boolean = true) => {
  return useQuery({
    queryKey: ['taxes', { activeOnly }],
    queryFn: async () => {
      const taxes = await taxesApi.getAll();
      return activeOnly ? taxes.filter((tax: Tax) => tax.isActive) : taxes;
    },
  });
};

export const useTax = (id: string) => {
  return useQuery({
    queryKey: ['taxes', id],
    queryFn: () => taxesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateTax = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; rate: number; code?: string; description?: string; isActive?: boolean }) => 
      taxesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
    },
  });
};

export const useUpdateTax = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tax> }) => 
      taxesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      queryClient.invalidateQueries({ queryKey: ['taxes', variables.id] });
    },
  });
};

export const useDeleteTax = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taxesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
    },
  });
};

export const useToggleTax = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taxesApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
    },
  });
};
