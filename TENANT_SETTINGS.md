# Tenant Settings Module - Documentation

## Overview
The Tenant Settings module provides a flexible configuration system that allows each tenant to customize core business parameters without affecting other tenants or the global system.

## Architecture

### Backend (NestJS)

#### Database Model
```prisma
model TenantSetting {
  id          String   @id @default(uuid())
  tenantId    String
  key         String
  value       Json
  category    String
  description String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, key])
  @@index([tenantId])
  @@index([category])
}
```

#### API Endpoints

All endpoints are protected by JWT authentication and automatically scoped to the authenticated tenant.

**Base URL:** `/settings`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | Get all settings (optionally filtered by category) |
| GET | `/settings/:key` | Get a specific setting by key |
| POST | `/settings` | Create a new setting |
| POST | `/settings/initialize` | Initialize default settings for tenant |
| PATCH | `/settings/:key` | Update a setting |
| DELETE | `/settings/:key` | Delete a setting (system settings cannot be deleted) |

**Query Parameters:**
- `category` (optional): Filter settings by category (e.g., `units`, `clients`, `products`)

#### Default Settings

When a new tenant is created, the following default settings are initialized:

**Units Category:**
- `units.weight`: Weight units (kg, g, ton, lb, oz)
- `units.volume`: Volume units (L, mL, gal, m³)
- `units.length`: Length units (m, cm, mm, km, in, ft)
- `units.quantity`: Quantity units (pcs, box, pallet, dozen, unit)
- `units.area`: Area units (m², cm², ha, acre, ft²)

**Client Settings:**
- `clients.types`: Client types (Individual, Company, VIP, Wholesale, Retail)

**Product Settings:**
- `products.types`: Product types (Raw Material, Finished Product, Semi-Finished, Consumable)

**Stock Settings:**
- `stock.in_reasons`: Stock IN reasons (Purchase, Production, Return, etc.)
- `stock.out_reasons`: Stock OUT reasons (Sale, Consumption, Damage, etc.)

**Finance Settings:**
- `finance.taxes`: Tax rates (VAT Standard 19%, VAT Reduced 7%, No Tax 0%)
- `finance.currency`: Currency settings (EUR, symbol, decimal/thousand separators)
- `finance.payment_terms`: Payment terms (Immediate, Net 15/30/60/90, Split 50/50)

**HR Settings:**
- `hr.contract_types`: Employment contract types (Full-Time, Part-Time, Contract, etc.)
- `hr.roles`: Employee roles (Manager, Team Leader, Staff, etc.)

### Frontend (Next.js)

#### Components

**Settings Page** (`app/(dashboard)/dashboard/settings/page.tsx`)
- Tab-based interface with 6 categories
- Icons for each category (Ruler, Users, Package, DollarSign, Briefcase)
- Responsive layout (2 columns on mobile, 6 on desktop)

**SettingsList Component** (`components/settings/settings-list.tsx`)
- Displays settings in a table format
- Edit and Delete actions (disabled for system settings)
- Visual representation of values (badges for arrays, JSON viewer for objects)
- Toast notifications for actions

#### Hooks

**useTenantSettings(category?)**
```typescript
import { useTenantSettings } from '@/hooks/useTenantSettings';

// Get all settings
const { data: allSettings } = useTenantSettings();

// Get settings by category
const { data: unitSettings } = useTenantSettings('units');
```

**useUpdateSetting()**
```typescript
const updateSetting = useUpdateSetting();

await updateSetting.mutateAsync({
  key: 'units.weight',
  data: { value: ['kg', 'g', 'ton', 'lb', 'oz', 'mg'] }
});
```

**useDeleteSetting()**
```typescript
const deleteSetting = useDeleteSetting();

await deleteSetting.mutateAsync('custom.setting.key');
```

#### API Client

```typescript
import { settingsApi } from '@/lib/api';

// Get all settings grouped by category
const settings = await settingsApi.getAll();

// Get settings for a specific category
const unitSettings = await settingsApi.getAll('units');

// Get a specific setting
const weightUnits = await settingsApi.getByKey('units.weight');

// Create a new setting
await settingsApi.create({
  key: 'custom.categories',
  value: ['Category A', 'Category B'],
  category: 'products',
  description: 'Custom product categories'
});

// Update a setting
await settingsApi.update('units.weight', {
  value: ['kg', 'g', 'ton', 'lb', 'oz', 'mg']
});

// Delete a setting
await settingsApi.delete('custom.categories');

// Initialize default settings (for new tenants)
await settingsApi.initializeDefaults();
```

## Usage Examples

### 1. Using Custom Units in Product Forms

```typescript
'use client';

import { useTenantSettings } from '@/hooks/useTenantSettings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ProductForm() {
  const { data: settings } = useTenantSettings('units');
  
  // Extract unit values
  const weightUnits = settings?.find(s => s.key === 'units.weight')?.value || [];
  const volumeUnits = settings?.find(s => s.key === 'units.volume')?.value || [];
  
  return (
    <form>
      <Select name="unit">
        <SelectTrigger>
          <SelectValue placeholder="Select unit" />
        </SelectTrigger>
        <SelectContent>
          <optgroup label="Weight">
            {weightUnits.map(unit => (
              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
            ))}
          </optgroup>
          <optgroup label="Volume">
            {volumeUnits.map(unit => (
              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
            ))}
          </optgroup>
        </SelectContent>
      </Select>
    </form>
  );
}
```

### 2. Using Client Types in Forms

```typescript
const { data: settings } = useTenantSettings('clients');
const clientTypes = settings?.find(s => s.key === 'clients.types')?.value || [];

// clientTypes = [
//   { value: 'INDIVIDUAL', label: 'Individual' },
//   { value: 'COMPANY', label: 'Company' },
//   { value: 'VIP', label: 'VIP Client' },
//   ...
// ]
```

### 3. Dynamic Tax Calculation

```typescript
const { data: settings } = useTenantSettings('finance');
const taxes = settings?.find(s => s.key === 'finance.taxes')?.value || [];
const defaultTax = taxes.find(t => t.isDefault);

// Calculate price with tax
const calculateTotal = (price: number) => {
  const taxRate = defaultTax?.rate || 0;
  return price * (1 + taxRate / 100);
};
```

### 4. Currency Formatting

```typescript
const { data: settings } = useTenantSettings('finance');
const currency = settings?.find(s => s.key === 'finance.currency')?.value;

const formatCurrency = (amount: number) => {
  const formatted = amount.toFixed(currency.decimals)
    .replace('.', currency.decimalSeparator)
    .replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandSeparator);
  
  return currency.position === 'before' 
    ? `${currency.symbol}${formatted}`
    : `${formatted}${currency.symbol}`;
};

// Example: formatCurrency(1234.56) => "1 234,56€"
```

## Security Features

1. **Tenant Isolation**: All settings are automatically scoped by tenantId
2. **System Settings Protection**: Settings marked as `isSystem: true` cannot be modified or deleted
3. **JWT Authentication**: All endpoints require valid tenant authentication
4. **Unique Constraints**: Prevents duplicate keys within a tenant

## Best Practices

1. **Naming Convention**: Use dot notation for keys (e.g., `category.subcategory.name`)
2. **System Settings**: Mark core settings as `isSystem: true` to prevent accidental deletion
3. **Default Values**: Always provide fallback values when accessing settings
4. **Validation**: Validate setting values in forms before submission
5. **Caching**: React Query automatically caches settings for better performance
6. **Translations**: Add translation keys for all setting labels and descriptions

## Future Enhancements

1. **Setting History**: Track changes to settings over time
2. **Setting Templates**: Predefined templates for different industries
3. **Import/Export**: Bulk import/export of settings
4. **Setting Dependencies**: Define relationships between settings
5. **Validation Rules**: JSON schema validation for setting values
6. **Setting Groups**: Group related settings together
7. **Role-Based Permissions**: Restrict setting management by user role

## Migration Guide

To add new default settings for existing tenants:

1. Add the setting definition in `TenantSettingsService.initializeDefaultSettings()`
2. Run database migration if schema changes are needed
3. Call `/settings/initialize` endpoint for each tenant (or via admin interface)

## Troubleshooting

**Issue**: Settings not appearing in UI
- Check that backend is running
- Verify JWT token is valid
- Check browser console for API errors

**Issue**: Cannot modify setting
- Verify setting is not marked as `isSystem: true`
- Check user has appropriate permissions

**Issue**: Settings not persisting
- Verify database connection
- Check Prisma schema is up to date
- Run `npx prisma generate` after schema changes

## Support

For issues or questions about the Tenant Settings module, contact the development team or refer to the main project documentation.
