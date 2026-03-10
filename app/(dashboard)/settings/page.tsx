'use client';

export const dynamic = 'force-dynamic';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Package,
  Users,
  DollarSign,
  Briefcase,
  Ruler,
  ListOrdered,
  ArrowRight,
  Boxes,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const systemParameters = [
    {
      key: 'units',
      title: t('settings.categories.units') || 'Units of Measurement',
      description:
        t('settings.categoryDescriptions.units') || 'Define weight, volume, length units',
      icon: Ruler,
      path: '/dashboard/settings/units',
      badge: t('settings.system') || 'System',
    },
    {
      key: 'currency',
      title: t('settings.categories.finance') || 'Financial Settings',
      description:
        t('settings.categoryDescriptions.finance') ||
        'Taxes, currency, payment terms, and invoicing',
      icon: DollarSign,
      path: '/dashboard/settings/finance',
      badge: t('settings.system') || 'System',
    },
  ];

  const businessParameters = [
    {
      key: 'order-statuses',
      title: t('orderStatuses.title') || 'Order Lifecycle',
      description: t('orderStatuses.description') || 'Manage your order workflow and statuses',
      icon: ListOrdered,
      path: '/dashboard/settings/order-statuses',
      badge: t('settings.workflow') || 'Workflow',
    },
    {
      key: 'clients',
      title: t('settings.categories.clients') || 'Client Parameters',
      description:
        t('settings.categoryDescriptions.clients') || 'Client types, categories, and attributes',
      icon: Users,
      path: '/dashboard/settings/clients',
      badge: t('settings.business') || 'Business',
    },
    {
      key: 'products',
      title: t('settings.categories.products') || 'Product Parameters',
      description:
        t('settings.categoryDescriptions.products') ||
        'Product types, categories, and classifications',
      icon: Package,
      path: '/dashboard/settings/products',
      badge: t('settings.business') || 'Business',
    },
    {
      key: 'stock',
      title: t('settings.categories.stock') || 'Stock Parameters',
      description:
        t('settings.categoryDescriptions.stock') || 'Stock movement reasons and tracking',
      icon: Boxes,
      path: '/dashboard/settings/stock',
      badge: t('settings.business') || 'Business',
    },
    {
      key: 'hr',
      title: t('settings.categories.hr') || 'HR Parameters',
      description:
        t('settings.categoryDescriptions.hr') || 'Employee roles, contract types, departments',
      icon: Briefcase,
      path: '/dashboard/settings/hr',
      badge: t('settings.business') || 'Business',
    },
  ];

  interface SettingParameter {
    id: string;
    key: string;
    value: unknown;
    category: string;
    description?: string;
    isSystem: boolean;
  }

  interface SettingParameterCard {
    key: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    path: string;
    badge: string;
  }

  const ParameterCard = ({ param }: { param: SettingParameterCard }) => (
    <Card
      className="group hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer h-full"
      onClick={() => router.push(param.path)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <param.icon className="h-5 w-5 text-primary" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {param.badge}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-tight">{param.title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <CardDescription className="text-sm mb-4 min-h-10">{param.description}</CardDescription>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between group-hover:bg-primary/10 transition-colors"
        >
          {t('common.configure') || 'Configure'}
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('settings.tenantSettings') || 'Tenant Settings'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('settings.tenantSettingsSubtitle') ||
                'Customize your workspace parameters and workflows'}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* System Parameters Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">
              {t('settings.systemParameters') || 'System Parameters'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('settings.systemParametersDesc') ||
                'Foundational settings and technical configurations'}
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {systemParameters.map((param) => (
            <ParameterCard key={param.key} param={param} />
          ))}
        </div>
      </div>

      <Separator />

      {/* Business Parameters Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">
              {t('settings.businessParameters') || 'Business Parameters'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('settings.businessParametersDesc') || 'Operational workflows and business rules'}
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {businessParameters.map((param) => (
            <ParameterCard key={param.key} param={param} />
          ))}
        </div>
      </div>
    </div>
  );
}
