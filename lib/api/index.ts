import apiClient from './client';
import {
  LoginCredentials,
  AuthResponse,
  User,
  Product,
  Client,
  Supplier,
  Order,
  Invoice,
  Employee,
  DashboardStats,
  SalesChartData,
  ProductionChartData,
  InventoryTransaction,
  StockAlert,
  Notification,
  Tenant,
  PaginatedResponse,
  ApiResponse,
  InvoiceNumberingConfig,
} from '@/types';

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  impersonate: async (token: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/impersonate', { token });
    return response.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  getSalesChart: async (period: 'week' | 'month' | 'year'): Promise<SalesChartData[]> => {
    const response = await apiClient.get<SalesChartData[]>(`/dashboard/sales-chart?period=${period}`);
    return response.data;
  },

  getProductionChart: async (period: 'week' | 'month'): Promise<ProductionChartData[]> => {
    const response = await apiClient.get<ProductionChartData[]>(`/dashboard/production-chart?period=${period}`);
    return response.data;
  },
};

// Products API
export const productsApi = {
  getAll: async (params?: {
    search?: string;
    type?: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
    skip?: number;
    take?: number;
  }): Promise<{ data: Product[]; pagination: { total: number; skip: number; take: number } }> => {
    const response = await apiClient.get('/tenant/products', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/tenant/products/${id}`);
    return response.data;
  },

  getStats: async (): Promise<ProductStats> => {
    const response = await apiClient.get<ProductStats>('/tenant/products/stats');
    return response.data;
  },

  getLowStock: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/tenant/products/low-stock');
    return response.data;
  },

  create: async (data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.post<Product>('/tenant/products', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.put<Product>(`/tenant/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenant/products/${id}`);
  },

  addStockMovement: async (data: Partial<StockMovement>): Promise<StockMovement> => {
    const response = await apiClient.post<StockMovement>('/tenant/products/stock-movements', data);
    return response.data;
  },

  getStockMovements: async (params?: {
    productId?: string;
    skip?: number;
    take?: number;
  }): Promise<{ data: StockMovement[]; pagination: { total: number; skip: number; take: number } }> => {
    const response = await apiClient.get('/tenant/products/stock-movements/history', { params });
    return response.data;
  },
};

// Inventory API (deprecated - use productsApi)
export const inventoryApi = {
  getStockAlerts: async (): Promise<StockAlert[]> => {
    const response = await apiClient.get<StockAlert[]>('/inventory/alerts');
    return response.data;
  },

  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    productId?: string;
  }): Promise<PaginatedResponse<InventoryTransaction>> => {
    const response = await apiClient.get<PaginatedResponse<InventoryTransaction>>('/inventory/transactions', { params });
    return response.data;
  },

  addStock: async (data: { productId: string; quantity: number; reason: string }): Promise<InventoryTransaction> => {
    const response = await apiClient.post<InventoryTransaction>('/inventory/stock-in', data);
    return response.data;
  },

  removeStock: async (data: { productId: string; quantity: number; reason: string }): Promise<InventoryTransaction> => {
    const response = await apiClient.post<InventoryTransaction>('/inventory/stock-out', data);
    return response.data;
  },
};

// Clients API
export const clientsApi = {
  getAll: async (params?: {
    search?: string;
    kind?: string;
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<{ data: Client[]; pagination: { total: number; skip: number; take: number } }> => {
    const response = await apiClient.get('/tenant/clients', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Client> => {
    const response = await apiClient.get<Client>(`/tenant/clients/${id}`);
    return response.data;
  },

  getStats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
    totalRevenue: number;
  }> => {
    const response = await apiClient.get('/tenant/clients/stats');
    return response.data;
  },

  getByKind: async (): Promise<{ kind: string; count: number }[]> => {
    const response = await apiClient.get('/tenant/clients/stats/by-kind');
    return response.data;
  },

  create: async (data: Partial<Client>): Promise<Client> => {
    const response = await apiClient.post<Client>('/tenant/clients', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Client>): Promise<Client> => {
    const response = await apiClient.patch<Client>(`/tenant/clients/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenant/clients/${id}`);
  },
};

// Suppliers API
export const suppliersApi = {
  getAll: async (params?: {
    search?: string;
    type?: string;
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<{ data: Supplier[]; pagination: { total: number; skip: number; take: number } }> => {
    const response = await apiClient.get('/tenant/suppliers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Supplier> => {
    const response = await apiClient.get<Supplier>(`/tenant/suppliers/${id}`);
    return response.data;
  },

  getStats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
    totalSpent: number;
  }> => {
    const response = await apiClient.get('/tenant/suppliers/stats');
    return response.data;
  },

  getByType: async (): Promise<{ type: string; count: number }[]> => {
    const response = await apiClient.get('/tenant/suppliers/stats/by-type');
    return response.data;
  },

  create: async (data: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.post<Supplier>('/tenant/suppliers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.patch<Supplier>(`/tenant/suppliers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenant/suppliers/${id}`);
  },
};

// Orders API
export const ordersApi = {
  getAll: async (params?: {
    search?: string;
    type?: 'CLIENT_ORDER' | 'SUPPLIER_ORDER';
    status?: 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    clientId?: string;
    supplierId?: string;
    startDate?: string;
    endDate?: string;
    skip?: number;
    take?: number;
  }): Promise<{ data: Order[]; pagination: { total: number; skip: number; take: number } }> => {
    const response = await apiClient.get('/tenant/orders', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/tenant/orders/${id}`);
    return response.data;
  },

  getStats: async (): Promise<{
    totalOrders: number;
    clientOrders: number;
    supplierOrders: number;
    draftOrders: number;
    confirmedOrders: number;
    completedOrders: number;
    totalRevenue: number;
    totalExpenses: number;
  }> => {
    const response = await apiClient.get('/tenant/orders/stats');
    return response.data;
  },

  getRecent: async (limit?: number): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/tenant/orders/recent', {
      params: { limit },
    });
    return response.data;
  },

  create: async (data: {
    type: 'CLIENT_ORDER' | 'SUPPLIER_ORDER';
    clientId?: string;
    supplierId?: string;
    orderDate?: string;
    deliveryDate?: string;
    notes?: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      notes?: string;
    }>;
  }): Promise<Order> => {
    const response = await apiClient.post<Order>('/tenant/orders', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Order>): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/tenant/orders/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenant/orders/${id}`);
  },
};

// Price Lists API
export const priceListsApi = {
  getAll: async (): Promise<any[]> => {
    const response = await apiClient.get('/tenant/price-lists');
    return response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/tenant/price-lists/${id}`);
    return response.data;
  },

  getActive: async (date?: string): Promise<any> => {
    const response = await apiClient.get('/tenant/price-lists/active', {
      params: { date },
    });
    return response.data;
  },

  getProductPrice: async (productId: string, date?: string): Promise<number | null> => {
    const response = await apiClient.get(`/tenant/price-lists/product-price/${productId}`, {
      params: { date },
    });
    return response.data;
  },

  create: async (data: any): Promise<any> => {
    const response = await apiClient.post('/tenant/price-lists', data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<any> => {
    const response = await apiClient.patch(`/tenant/price-lists/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenant/price-lists/${id}`);
  },

  downloadPdf: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/tenant/price-lists/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Order Statuses API
export const orderStatusesApi = {
  getAll: async (): Promise<any[]> => {
    const response = await apiClient.get('/tenant/order-statuses');
    return response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/tenant/order-statuses/${id}`);
    return response.data;
  },

  create: async (data: { name: string; slug: string; color?: string; position?: number; isActive?: boolean }): Promise<any> => {
    const response = await apiClient.post('/tenant/order-statuses', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{ name: string; slug: string; color: string; position: number; isActive: boolean }>): Promise<any> => {
    const response = await apiClient.patch(`/tenant/order-statuses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenant/order-statuses/${id}`);
  },

  reorder: async (statusIds: string[]): Promise<void> => {
    await apiClient.post('/tenant/order-statuses/reorder', { statusIds });
  },
};

// Taxes API
export const taxesApi = {
  getAll: async (): Promise<any[]> => {
    const response = await apiClient.get('/tenant/taxes');
    return response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/tenant/taxes/${id}`);
    return response.data;
  },

  create: async (data: { name: string; rate: number; code?: string; description?: string; isActive?: boolean }): Promise<any> => {
    const response = await apiClient.post('/tenant/taxes', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{ name: string; rate: number; code: string; description: string; isActive: boolean }>): Promise<any> => {
    const response = await apiClient.patch(`/tenant/taxes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenant/taxes/${id}`);
  },

  toggle: async (id: string): Promise<any> => {
    const response = await apiClient.patch(`/tenant/taxes/${id}/toggle`);
    return response.data;
  },
};

// Invoices API
export const invoicesApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    clientId?: string;
    search?: string;
  }): Promise<Invoice[]> => {
    const response = await apiClient.get<Invoice[]>('/invoices', { params });
    return response.data;
  },

  getStats: async (): Promise<{
    total: number;
    byStatus: {
      draft: number;
      sent: number;
      paid: number;
      overdue: number;
      partiallyPaid: number;
    };
    totals: {
      totalInvoiced: number;
      totalPaid: number;
      totalOutstanding: number;
    };
  }> => {
    const response = await apiClient.get('/invoices/stats');
    return response.data;
  },

  getById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>('/invoices', data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<Invoice> => {
    const response = await apiClient.patch<Invoice>(`/invoices/${id}`, data);
    return response.data;
  },

  validate: async (id: string, payload?: { manualSequence?: number }): Promise<Invoice> => {
    const response = await apiClient.patch<Invoice>(`/invoices/${id}/validate`, payload);
    return response.data;
  },

  downloadPdf: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },

  createCreditNote: async (invoiceId: string, data: {
    items: Array<{
      itemId: string;
      quantity: number;
      reason: string;
    }>;
    reason: string;
    notes?: string;
  }): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>(`/invoices/${invoiceId}/credit-note`, data);
    return response.data;
  },
};

// Employees API (HR Module)
export const employeesApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
  }): Promise<PaginatedResponse<Employee>> => {
    const response = await apiClient.get<PaginatedResponse<Employee>>('/employees', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  create: async (data: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.post<Employee>('/employees', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.put<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async (): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },
};

// Tenant API
export const tenantApi = {
  getCurrent: async (): Promise<Tenant> => {
    const response = await apiClient.get<Tenant>('/tenant');
    return response.data;
  },

  update: async (data: Partial<Tenant>): Promise<Tenant> => {
    const response = await apiClient.put<Tenant>('/tenant', data);
    return response.data;
  },
};

// Settings API
export const settingsApi = {
  getAll: async (category?: string): Promise<any> => {
    const params = category ? { category } : {};
    const response = await apiClient.get('/settings', { params });
    return response.data;
  },

  getByKey: async (key: string): Promise<any> => {
    const response = await apiClient.get(`/settings/${key}`);
    return response.data;
  },

  create: async (data: {
    key: string;
    value: any;
    category: string;
    description?: string;
  }): Promise<any> => {
    const response = await apiClient.post('/settings', data);
    return response.data;
  },

  update: async (key: string, data: { value?: any; description?: string }): Promise<any> => {
    const response = await apiClient.patch(`/settings/${key}`, data);
    return response.data;
  },

  delete: async (key: string): Promise<void> => {
    await apiClient.delete(`/settings/${key}`);
  },

  initializeDefaults: async (): Promise<void> => {
    const response = await apiClient.post('/settings/initialize');
    return response.data;
  },
};

// Invoice Numbering API
export const invoiceNumberingApi = {
  getConfig: async (): Promise<InvoiceNumberingConfig> => {
    const response = await apiClient.get<InvoiceNumberingConfig>('/invoice-numbering');
    return response.data;
  },

  updateConfig: async (
    data: Partial<InvoiceNumberingConfig> & { nextSequence?: number; manualOverride?: boolean }
  ): Promise<InvoiceNumberingConfig> => {
    const response = await apiClient.patch<InvoiceNumberingConfig>('/invoice-numbering', data);
    return response.data;
  },
};

export * from './super-admin';