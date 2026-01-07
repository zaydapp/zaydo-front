'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

export default function ImpersonatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = useMemo(() => searchParams.get('token'), [searchParams]);

  const [status, setStatus] = useState<'loading' | 'error'>(() =>
    token ? 'loading' : 'error',
  );
  const [message, setMessage] = useState<string>(() =>
    token ? 'Preparing impersonated session...' : 'Missing impersonation token.',
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const run = async () => {
      try {
        const response = await authApi.impersonate(token);
        
        console.log('=== IMPERSONATION RESPONSE ===');
        console.log('Response:', response);
        console.log('User:', response.user);
        console.log('AccessToken:', response.accessToken);
        console.log('TenantId:', response.user.tenantId);

        // Use sessionStorage for impersonated sessions to keep them tab-isolated
        // This prevents interference with the super admin session in other tabs
        sessionStorage.setItem('impersonated', 'true');
        sessionStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) {
          sessionStorage.setItem('refreshToken', response.refreshToken);
        } else {
          sessionStorage.removeItem('refreshToken');
        }
        sessionStorage.setItem('user', JSON.stringify(response.user));
        sessionStorage.setItem('tenantId', response.user.tenantId);
        
        console.log('=== STORED IN SESSIONSTORAGE ===');
        console.log('impersonated:', sessionStorage.getItem('impersonated'));
        console.log('user:', sessionStorage.getItem('user'));
        console.log('tenantId:', sessionStorage.getItem('tenantId'));
        console.log('accessToken exists:', !!sessionStorage.getItem('accessToken'));

        toast.success(`Connected as ${response.user.email}`, {
          description: 'This is an impersonated session in this tab only.'
        });
        
        // Use window.location.href to force a full page reload
        // This ensures the auth and tenant contexts re-initialize with the new sessionStorage data
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Impersonation failed', error);
        setStatus('error');
        setMessage('Unable to complete impersonation. The link may have expired or the backend endpoint is not implemented yet.');
      }
    };

    void run();
  }, [router, token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="max-w-md space-y-3 rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="text-lg font-semibold">Starting impersonation session</h1>
        <p className="text-sm text-muted-foreground">
          {message}
          {status === 'loading' && token && ' This tab will redirect automatically once complete.'}
        </p>
        {status === 'loading' && token && (
          <div className="mx-auto mt-4 h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
        {status === 'error' && (
          <button
            type="button"
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium"
            onClick={() => router.replace('/super-admin/tenants')}
          >
            Back to Super Admin
          </button>
        )}
      </div>
      {status === 'loading' && token && (
        <p className="text-xs text-muted-foreground">
          Tip: Keep this tab separate from your super admin session to avoid cross-session conflicts.
        </p>
      )}
    </div>
  );
}

