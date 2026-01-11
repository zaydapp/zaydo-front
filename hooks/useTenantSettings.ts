/*eslint-disable */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api';
import { TenantSetting } from '@/types';

export function useTenantSettings(category?: string) {
  return useQuery({
    queryKey: category ? ['settings', category] : ['settings'],
    queryFn: () => settingsApi.getAll(category),
  });
}

export function useTenantSetting(key: string) {
  return useQuery({
    queryKey: ['setting', key],
    queryFn: () => settingsApi.getByKey(key),
    enabled: !!key,
  });
}

export function useCreateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: any }) => settingsApi.update(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useDeleteSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
