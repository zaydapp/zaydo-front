'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminUsersApi, superAdminTenantsApi } from '@/lib/api';
import { TenantSummary, TenantUserSummary } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Shield, MoreHorizontal } from 'lucide-react';

interface FilterState {
  search?: string;
  tenantId?: string | 'all';
  role?: string | 'all';
  status?: string | 'all';
  page?: number;
}

const PAGE_SIZE = 25;

export default function SuperAdminUsersPage() {
  const [filters, setFilters] = useState<FilterState>({ page: 1 });
  const queryClient = useQueryClient();

  const tenantsQuery = useQuery({
    queryKey: ['super-admin', 'tenants', 'list'],
    queryFn: async () => {
      const response = await superAdminTenantsApi.list({ limit: 1000, page: 1 });
      return response.data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ['super-admin', 'users', filters],
    queryFn: async () => {
      const response = await superAdminUsersApi.list({
        search: filters.search,
        tenantId: filters.tenantId && filters.tenantId !== 'all' ? filters.tenantId : undefined,
        role: filters.role && filters.role !== 'all' ? filters.role : undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        page: filters.page,
        limit: PAGE_SIZE,
      });
      return response;
    },
    keepPreviousData: true,
  });

  const suspendMutation = useMutation({
    mutationFn: (payload: { userId: string; reason?: string }) =>
      superAdminUsersApi.suspendUser(payload.userId, payload.reason),
    onSuccess: () => {
      toast.success('User suspended');
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to suspend user');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => superAdminUsersApi.resetPassword(userId),
    onSuccess: () => {
      toast.success('Password reset link sent');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to reset password');
    },
  });

  const data = usersQuery.data;
  const users = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users Across Tenants</h1>
        <p className="text-sm text-muted-foreground">
          Review every user provisioned across tenants. Handle escalations, suspend accounts, and trigger password resets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Input
            placeholder="Search by name or email"
            value={filters.search ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                search: event.target.value,
                page: 1,
              }))
            }
          />
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
            value={filters.role ?? 'all'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                role: value,
                page: 1,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="ADMIN">Tenant admin</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                status: value,
                page: 1,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INVITED">Invited</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: TenantUserSummary) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{`${user.firstName} ${user.lastName}`}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{user.tenantName}</p>
                      <p className="text-xs text-muted-foreground">{user.tenantId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'SUSPENDED' ? 'destructive' : 'secondary'} className="capitalize">
                      {user.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => resetPasswordMutation.mutate(user.id)}>
                          Send password reset
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            suspendMutation.mutate({
                              userId: user.id,
                            })
                          }
                        >
                          {user.status === 'SUSPENDED' ? 'Reinstate user' : 'Suspend user'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!users.length && !usersQuery.isLoading && (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              No users match the current filters.
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-end gap-3 text-sm">
              <p className="text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: Math.max((prev.page ?? 1) - 1, 1),
                    }))
                  }
                  disabled={(filters.page ?? 1) === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: Math.min((prev.page ?? 1) + 1, totalPages),
                    }))
                  }
                  disabled={(filters.page ?? 1) === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


