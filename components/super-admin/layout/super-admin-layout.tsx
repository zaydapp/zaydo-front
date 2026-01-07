'use client';

import { ReactNode } from 'react';
import { SuperAdminSidebar } from './sidebar';
import { SuperAdminTopbar } from './topbar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <SuperAdminSidebar />
      <SidebarInset>
        <SuperAdminTopbar />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}


