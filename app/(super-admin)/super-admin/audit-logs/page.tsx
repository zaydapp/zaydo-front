'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminAuditLogsApi, superAdminTenantsApi } from '@/lib/api';
import { AuditLogEntry, TenantSummary } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Filters {
  tenantId?: string | 'all';
  actorType?: string | 'all';
  action?: string;
  from?: string;
  to?: string;
  page?: number;
}

const PAGE_SIZE = 30;

export default function SuperAdminAuditLogsPage() {
  const [filters, setFilters] = useState<Filters>({ page: 1 });

  const tenantsQuery = useQuery({
    queryKey: ['super-admin', 'tenants', 'list'],
    queryFn: async () => {
      const response = await superAdminTenantsApi.list({ page: 1, limit: 1000 });
      return response.data;
    },
  });

  const logsQuery = useQuery({
    queryKey: ['super-admin', 'audit-logs', filters],
    queryFn: async () => {
      const response = await superAdminAuditLogsApi.list({
        tenantId: filters.tenantId && filters.tenantId !== 'all' ? filters.tenantId : undefined,
        actorType: filters.actorType && filters.actorType !== 'all' ? filters.actorType : undefined,
        action: filters.action?.trim() || undefined,
        from: filters.from,
        to: filters.to,
        page: filters.page,
        limit: PAGE_SIZE,
      });
      return response;
    },
    keepPreviousData: true,
  });

  const data = logsQuery.data;
  const logs = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Every action performed by the system, the owner, or tenant admins is recorded for compliance and traceability.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <Select
            value={filters.tenantId ?? 'all'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                tenantId: value,
                page: 1,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tenant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tenants</SelectItem>
              {(tenantsQuery.data ?? []).map((tenant: TenantSummary) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.actorType ?? 'all'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                actorType: value,
                page: 1,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Actor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actors</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super admin</SelectItem>
              <SelectItem value="TENANT_ADMIN">Tenant admin</SelectItem>
              <SelectItem value="SYSTEM">System</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Action contains..."
            value={filters.action ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                action: event.target.value,
                page: 1,
              }))
            }
          />

          <Input
            type="date"
            value={filters.from ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                from: event.target.value,
                page: 1,
              }))
            }
          />

          <Input
            type="date"
            value={filters.to ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                to: event.target.value,
                page: 1,
              }))
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Audit trail</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Tenant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: AuditLogEntry) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{log.actorName ?? 'System'}</p>
                      <Badge variant="outline" className="uppercase">
                        {log.actorType}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{log.action}</p>
                      {log.context && (
                        <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                          {JSON.stringify(log.context)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{log.resourceType}</p>
                      {log.resourceId && <p className="text-xs text-muted-foreground">{log.resourceId}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.tenantName ? (
                      <div className="text-sm">
                        <p className="font-medium">{log.tenantName}</p>
                        {log.tenantId && <p className="text-xs text-muted-foreground">{log.tenantId}</p>}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Global</p>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!logs.length && !logsQuery.isLoading && (
            <div className="mt-6 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              No audit events found for the selected filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

