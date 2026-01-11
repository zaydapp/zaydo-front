'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSuperAdminAuth } from '@/contexts/super-admin-auth-context';

interface SuperAdminProtectedProps {
  children: ReactNode;
}

export function SuperAdminProtected({ children }: SuperAdminProtectedProps) {
  const { isAuthenticated, isLoading } = useSuperAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/super-admin/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-2 text-sm">Checking permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
