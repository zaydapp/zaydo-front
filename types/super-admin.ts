// Super Admin specific types for managing the multi-tenant SaaS platform

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'INACTIVE';

export interface SuperAdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN';
  avatar?: string;
  lastLoginAt?: string;
  permissions: string[];
}

export interface ModuleDefinition {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
  isBaseModule: boolean;
  priceMonthly: number;
  isGloballyEnabled: boolean;
  activeTenantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantModuleAssignment {
  moduleId: string;
  moduleKey: string;
  moduleName: string;
  isEnabled: boolean;
  enabledAt?: string;
  disabledAt?: string;
}

export interface TenantContact {
  name: string;
  email: string;
  phone?: string;
}

export interface TenantSummary {
  id: string;
  companyName: string;
  slug: string;
  contact: TenantContact;
  status: TenantStatus;
  monthlyRecurringRevenue: number;
  activeModuleKeys: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantDetails extends TenantSummary {
  address?: string;
  industry?: string;
  website?: string;
  modules: TenantModuleAssignment[];
  settings?: Array<{ key: string; value: unknown }>;
  userCount: number;
  activeUserCount: number;
  usage: {
    storageUsedGb: number;
    apiCallsThisMonth: number;
    lastActiveAt?: string;
  };
  auditLogCount: number;
}

export interface TenantUserSummary {
  id: string;
  tenantId: string;
  tenantName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  lastLoginAt?: string;
  createdAt: string;
}

export interface GlobalKpiStats {
  totalTenants: number;
  activeTenants: number;
  newTenantsThisMonth: number;
  churnedTenantsThisMonth: number;
  totalUsers: number;
  activeUsers: number;
  monthlyRecurringRevenue: number;
  arr: number;
  averageRevenuePerUser: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  secondaryValue?: number;
}

export interface ModuleUsageDatum {
  moduleKey: string;
  moduleName: string;
  activeTenantCount: number;
  totalTenantCount: number;
}

export interface SuperAdminDashboardData {
  kpis: GlobalKpiStats;
  growthSeries: TimeSeriesPoint[];
  revenueSeries: TimeSeriesPoint[];
  moduleUsage: ModuleUsageDatum[];
}

export interface AuditLogEntry {
  id: string;
  actorType: 'SYSTEM' | 'SUPER_ADMIN' | 'TENANT_ADMIN';
  actorId?: string;
  actorName?: string;
  tenantId?: string;
  tenantName?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  context?: Record<string, unknown>;
  createdAt: string;
}

export interface SystemBrandingSettings {
  productName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

export interface SystemEmailSettings {
  fromName: string;
  fromEmail: string;
  replyToEmail?: string;
  provider: 'postmark' | 'sendgrid' | 'smtp' | 'resend' | 'custom';
  isVerified: boolean;
}

export interface StripeSettings {
  publishableKey?: string;
  secretKeyMasked?: string;
  webhookSecretMasked?: string;
  secretKey?: string;
  webhookSecret?: string;
  isConfigured: boolean;
  lastSyncedAt?: string;
}

export interface AiIntegrationSettings {
  provider?: 'openai' | 'anthropic' | 'azure' | 'custom';
  apiKeyMasked?: string;
  apiKey?: string;
  isEnabled: boolean;
  lastUsedAt?: string;
}

export interface SuperAdminSettingsPayload {
  branding: SystemBrandingSettings;
  email: SystemEmailSettings;
  stripe: StripeSettings;
  aiAssistant: AiIntegrationSettings;
}

export interface TenantCreateInput {
  name: string;
  slug: string;
  contactEmail: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  industry?: string;
  website?: string;
  status?: TenantStatus;
  currency?: string;
  moduleKeys?: string[];
}

export interface TenantUpdateInput {
  name?: string;
  slug?: string;
  contactEmail?: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  industry?: string;
  website?: string;
  status?: TenantStatus;
  currency?: string;
  moduleKeys?: string[];
}


