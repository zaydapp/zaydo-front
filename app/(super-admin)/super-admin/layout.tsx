"use client";

import { ReactNode } from 'react';
import { SuperAdminAuthProvider } from '@/contexts/super-admin-auth-context';
import { SuperAdminRouteShell } from '@/components/super-admin/layout/route-shell';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SuperAdminAuthProvider>
      <SuperAdminRouteShell>{children}</SuperAdminRouteShell>
    </SuperAdminAuthProvider>
  );
}


