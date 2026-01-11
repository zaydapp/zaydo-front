'use client';

import { ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { SuperAdminLayout } from './super-admin-layout';
import { SuperAdminProtected } from '../guards/super-admin-protected';

const PUBLIC_ROUTES = ['/super-admin/login', '/super-admin/support'];

export function SuperAdminRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isPublicRoute = useMemo(
    () => PUBLIC_ROUTES.some((route) => pathname.startsWith(route)),
    [pathname]
  );

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <SuperAdminProtected>
      <SuperAdminLayout>{children}</SuperAdminLayout>
    </SuperAdminProtected>
  );
}
