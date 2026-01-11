'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Puzzle,
  CreditCard,
  FileText,
  Settings,
  Shield,
} from 'lucide-react';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

const navigationGroups = [
  {
    label: 'Main',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', href: '/super-admin/dashboard' }],
  },
  {
    label: 'Management',
    items: [
      { icon: Building2, label: 'Tenants', href: '/super-admin/tenants' },
      { icon: Puzzle, label: 'Modules', href: '/super-admin/modules' },
      { icon: CreditCard, label: 'Plans', href: '/super-admin/plans' },
      { icon: FileText, label: 'Billing', href: '/super-admin/billing' },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: FileText, label: 'System Logs', href: '/super-admin/logs' },
      { icon: Settings, label: 'Settings', href: '/super-admin/settings' },
    ],
  },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Shield className="h-6 w-6 text-primary" />
          {state === 'expanded' && <span className="text-lg font-bold">Super Admin</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {state === 'expanded' && (
        <SidebarFooter>
          <div className="px-3 py-2 text-xs text-muted-foreground">Super Admin Panel v1.0</div>
        </SidebarFooter>
      )}
    </SidebarPrimitive>
  );
}
