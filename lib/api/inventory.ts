import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

// Types
export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku?: string;
    unit: string;
    type: string;
  };
}

export interface StockSummaryItem {
  id: string;
  name: string;
  sku?: string;
  type: string;
  unit: string;
  minStock: number;
  currentStock: number;
  status: 'OK' | 'LOW' | 'OUT';
  shortage: number;
}

export interface ProductWithStock {
  id: string;
  name: string;
  sku?: string;
  type: string;
  unit: string;
  minStock: number;
  currentStock: number;
  shortage?: number;
}

export interface CreateStockMovementDto {
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
  reference?: string;
  notes?: string;
}

export interface StockStats {
  total: number;
  rawMaterials: number;
  finishedProducts: number;
  lowStock: number;
}

// API Functions
const inventoryApi = {
  // Get stock summary
  getStockSummary: async (): Promise<StockSummaryItem[]> => {
    const response = await apiClient.get('/tenant/products/stock-summary');
    return response.data;
  },

  // Get stock movements
  getStockMovements: async (params?: { productId?: string; skip?: number; take?: number }) => {
    const response = await apiClient.get('/tenant/products/stock-movements', { params });
    return response.data;
  },

  // Add stock movement
  addStockMovement: async (data: CreateStockMovementDto): Promise<StockMovement> => {
    const response = await apiClient.post('/tenant/products/stock-movements', data);
    return response.data;
  },

  // Get low stock alerts
  getLowStockAlerts: async (): Promise<ProductWithStock[]> => {
    const response = await apiClient.get('/tenant/products/low-stock');
    return response.data;
  },

  // Get product stats
  getProductStats: async (): Promise<StockStats> => {
    const response = await apiClient.get('/tenant/products/stats');
    return response.data;
  },
};

// React Query Hooks

export const useStockSummary = () => {
  return useQuery({
    queryKey: ['stock-summary'],
    queryFn: inventoryApi.getStockSummary,
  });
};

export const useStockMovements = (params?: { productId?: string; skip?: number; take?: number }) => {
  return useQuery({
    queryKey: ['stock-movements', params],
    queryFn: () => inventoryApi.getStockMovements(params),
  });
};

export const useAddStockMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inventoryApi.addStockMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useLowStockAlerts = () => {
  return useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: inventoryApi.getLowStockAlerts,
  });
};

export const useProductStats = () => {
  return useQuery({
    queryKey: ['product-stats'],
    queryFn: inventoryApi.getProductStats,
  });
};
