'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useTenant } from '@/contexts/tenant-context';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  UserPlus,
  ShoppingCart,
  UserCog,
  Settings,
  Tag,
  Receipt,
} from 'lucide-react';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

interface NavItem {
  titleKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  requiredModules?: string[]; // Module keys required to show this nav item
}

// Map navigation items to their required module keys
const navItems: NavItem[] = [
  {
    titleKey: 'navigation.overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    requiredModules: ['dashboards-analytics'], // Always show dashboard if analytics module is enabled
  },
  {
    titleKey: 'navigation.products',
    href: '/dashboard/products',
    icon: Package,
    requiredModules: ['products-stocks'],
  },
  {
    titleKey: 'navigation.inventory',
    href: '/dashboard/inventory',
    icon: Warehouse,
    requiredModules: ['products-stocks'],
  },
  {
    titleKey: 'navigation.clients',
    href: '/dashboard/clients',
    icon: Users,
    requiredModules: ['clients-suppliers'],
  },
  {
    titleKey: 'navigation.suppliers',
    href: '/dashboard/suppliers',
    icon: UserPlus,
    requiredModules: ['clients-suppliers'],
  },
  {
    titleKey: 'navigation.orders',
    href: '/dashboard/orders',
    icon: ShoppingCart,
    requiredModules: ['orders-invoices'],
  },
  {
    titleKey: 'navigation.priceLists',
    href: '/dashboard/price-lists',
    icon: Tag,
    requiredModules: ['price-lists'],
  },
  {
    titleKey: 'navigation.billing',
    href: '/dashboard/billing',
    icon: Receipt,
    requiredModules: ['billing'],
  },
  {
    titleKey: 'navigation.hr',
    href: '/dashboard/hr',
    icon: UserCog,
    requiredModules: ['hr-management'],
  },
  {
    titleKey: 'navigation.settings',
    href: '/dashboard/settings',
    icon: Settings,
    // No required modules - settings always available
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { tenant, isLoading } = useTenant();
  const { state } = useSidebar();

  // Filter navigation items based on enabled modules
  const visibleNavItems = navItems.filter((item) => {
    // If no required modules specified, always show the item (e.g., Settings)
    if (!item.requiredModules || item.requiredModules.length === 0) {
      return true;
    }

    // If tenant not loaded yet, don't show module-dependent items
    if (!tenant?.enabledModules) {
      return false;
    }

    // Show item if tenant has at least one of the required modules enabled
    return item.requiredModules.some((moduleKey) => tenant.enabledModules?.includes(moduleKey));
  });

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader>
        {state === 'expanded' ? (
          <Link href="/dashboard" className="flex items-center space-x-2 px-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {tenant?.name?.charAt(0).toUpperCase() || 'Z'}
              </span>
            </div>
            <span className="text-xl font-bold truncate">{tenant?.name || 'Zaydo'}</span>
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {tenant?.name?.charAt(0).toUpperCase() || 'Z'}
              </span>
            </div>
          </Link>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const title = t(item.titleKey);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={title}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {state === 'expanded' && (
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            {t('navigation.needHelp')}{' '}
            <button className="text-foreground hover:underline font-medium">
              {t('navigation.contactSupport')}
            </button>
          </div>
        )}
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
