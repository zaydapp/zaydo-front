// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  planType: 'free' | 'starter' | 'professional' | 'enterprise';
  settings: TenantSettings;
  createdAt: string;
  enabledModules?: string[]; // Array of enabled module keys
}

export interface TenantSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  enableNotifications: boolean;
  enableAI: boolean;
}

// Product Types
export interface Product {
  id: string;
  tenantId: string;
  name: string;
  type: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
  sku?: string;
  description?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  supplierId?: string;
  notes?: string;
  images?: string[];
  mainImageIndex?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

// Stock Movement Types
export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
    unit: string;
  };
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

export interface ProductStats {
  total: number;
  rawMaterials: number;
  finishedProducts: number;
  lowStock: number;
}

// Inventory Types (deprecated - use StockMovement)
export interface InventoryTransaction {
  id: string;
  productId: string;
  product?: Product;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  reference?: string;
  createdBy: string;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  product: Product;
  currentStock: number;
  minStock: number;
  status: 'LOW' | 'OUT_OF_STOCK';
}

// Client and Supplier Types
export type ClientKind = 'INDIVIDUAL' | 'COMPANY' | 'VIP' | 'WHOLESALE' | 'RETAIL';

export interface Client {
  id: string;
  kind: ClientKind;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalOrders: number;
  totalRevenue: number;
  lastOrderDate?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  contactPerson?: string;
  taxId?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Order Types
export enum OrderType {
  CLIENT_ORDER = 'CLIENT_ORDER',
  SUPPLIER_ORDER = 'SUPPLIER_ORDER',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

// Add to your types file (@/types/index.ts)
export interface OrderStatusItem {
  id: string;
  name: string;
  slug: string;
  color: string;
  position: number;
  isActive: boolean;
  isSystem?: boolean;
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  type: OrderType;
  clientId?: string;
  supplierId?: string;
  client?: { id: string; name: string };
  supplier?: { id: string; name: string };
  status: OrderStatusItem | OrderStatus; // Can be the relation object or enum
  orderDate: string;
  deliveryDate?: string;
  totalAmount: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  invoices?: Invoice[];
  invoice?: Invoice;
}

// Invoice Types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  order?: Order;
  clientId: string;
  client?: Client;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount?: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  issueDate: string;
  paidAt?: string;
  notes?: string;
  paymentTerms?: string;
  termsConditions?: string;
  issuedBy?: string;
  validatedBy?: string;
  validatedAt?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  notes?: string;
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
}

export type InvoiceNumberingResetFrequency = 'NEVER' | 'YEARLY' | 'MONTHLY';

export interface InvoiceNumberingConfig {
  id: string;
  tenantId: string;
  prefixTemplate: string;
  formatTemplate: string;
  sequenceLength: number;
  resetFrequency: InvoiceNumberingResetFrequency;
  allowManualOverride: boolean;
  nextSequence: number;
  lastResetAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Production Batch Types
export interface ProductionBatch {
  id: string;
  batchNumber: string;
  productId: string;
  product?: Product;
  quantity: number;
  status: BatchStatus;
  startDate: string;
  endDate?: string;
  notes?: string;
  materials: BatchMaterial[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchMaterial {
  id: string;
  batchId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unit: string;
}

export enum BatchStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Employee Types (HR Module)
export interface Employee {
  id: string;
  userId?: string;
  user?: User;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
  status: EmployeeStatus;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
}

// Dashboard Statistics Types
export interface DashboardStats {
  totalSales: number;
  salesGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  inventoryValue: number;
  inventoryGrowth: number;
  activeClients: number;
  clientsGrowth: number;
  lowStockCount: number;
  pendingOrders: number;
  overdueInvoices: number;
}

export interface SalesChartData {
  date: string;
  sales: number;
  orders: number;
}

export interface ProductionChartData {
  date: string;
  produced: number;
  target: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

// Tenant Settings Types
export interface TenantSetting {
  id: string;
  tenantId: string;
  key: string;
  value: unknown; // JSON value
  category: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettingCategory {
  key: string;
  label: string;
  description: string;
  icon?: string;
}

export interface CreateSettingDto {
  key: string;
  value: unknown;
  category: string;
  description?: string;
  isSystem?: boolean;
}

export interface UpdateSettingDto {
  value?: unknown;
  description?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export * from './super-admin';
