'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TenantDetails, TenantUserSummary, ModuleDefinition } from '@/types';
import {
  Loader2,
  Globe,
  Mail,
  MapPin,
  UsersRound,
  ShieldAlert,
  Clock3,
  Plus,
  MoreHorizontal,
  RefreshCcw,
  LogIn,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TenantDetailsTabsProps {
  tenant: TenantDetails;
  users: TenantUserSummary[];
  usersLoading: boolean;
  onToggleModule: (moduleId: string, isEnabled: boolean) => void;
  onStatusChange: (status: TenantDetails['status']) => Promise<void>;
  onEdit: () => void;
  moduleDefinitions: ModuleDefinition[];
  onSuspendUser: (user: TenantUserSummary) => Promise<void> | void;
  onResetPassword: (user: TenantUserSummary) => Promise<void> | void;
  onImpersonateUser: (user: TenantUserSummary) => Promise<void> | void;
  isStatusUpdating?: boolean;
  togglingModuleId?: string | null;
  actingUserId?: string | null;
  resettingUserId?: string | null;
  impersonatingUserId?: string | null;
}

export function TenantDetailsTabs({
  tenant,
  users,
  usersLoading,
  onToggleModule,
  onStatusChange,
  onEdit,
  moduleDefinitions,
  onSuspendUser,
  onResetPassword,
  onImpersonateUser,
  isStatusUpdating,
  togglingModuleId,
  actingUserId,
  resettingUserId,
  impersonatingUserId,
}: TenantDetailsTabsProps) {
  const isSuspended = tenant.status === 'SUSPENDED';

  const moduleInfo = useMemo(() => {
    const byKey = new Map<string, ModuleDefinition>();
    moduleDefinitions.forEach((definition) => {
      byKey.set(definition.key, definition);
    });

    return tenant.modules.map((assignment) => {
      const definition = byKey.get(assignment.moduleKey);
      return {
        assignment,
        definition,
        isCore: definition?.isGloballyEnabled ?? false,
      };
    });
  }, [tenant.modules, moduleDefinitions]);

  const baseModules = moduleInfo.filter((item) => item.isCore);
  const addOnModules = moduleInfo.filter((item) => !item.isCore);
  const activeModuleCount = moduleInfo.filter((item) => item.assignment.isEnabled).length;

  const createdAt = tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '—';
  const updatedAt = tenant.updatedAt ? new Date(tenant.updatedAt).toLocaleDateString() : '—';
  const lastActive = tenant.usage.lastActiveAt
    ? new Date(tenant.usage.lastActiveAt).toLocaleString()
    : 'No activity yet';

  const activeUsers = users.filter((user) => user.status === 'ACTIVE').length;
  const invitedUsers = users.filter((user) => user.status === 'INVITED').length;
  const suspendedUsers = users.filter((user) => user.status === 'SUSPENDED').length;

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="modules">Modules</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                {tenant.companyName}
                <Badge variant="outline" className="capitalize">
                  {tenant.status.toLowerCase()}
                </Badge>
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  {tenant.slug}.yourdomain.com
                </span>
                <span className="text-muted-foreground">Created {createdAt}</span>
                <span className="text-muted-foreground">Updated {updatedAt}</span>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isSuspended ? 'default' : 'destructive'}
                onClick={() => onStatusChange(isSuspended ? 'ACTIVE' : 'SUSPENDED')}
                disabled={isStatusUpdating}
                className="gap-2"
              >
                {isStatusUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSuspended ? 'Activate tenant' : 'Suspend tenant'}
              </Button>
              <Button variant="secondary" onClick={onEdit}>
                Edit details
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Primary contact</p>
                <div className="mt-1 space-y-1 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {tenant.contact.email || 'No email on file'}
                  </div>
                  {tenant.contact.name && (
                    <p className="text-muted-foreground">{tenant.contact.name}</p>
                  )}
                  {tenant.contact.phone && (
                    <p className="text-muted-foreground">{tenant.contact.phone}</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Location & industry</p>
                <div className="mt-1 space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {tenant.address || 'No address'}
                  </div>
                  <p className="text-muted-foreground">
                    Industry: {tenant.industry || 'Not specified'}
                  </p>
                  {tenant.website && (
                    <a
                      className="text-sm text-primary underline"
                      href={tenant.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {tenant.website}
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-muted/40 shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription>Active modules</CardDescription>
                  <CardTitle className="text-2xl font-semibold">{activeModuleCount}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {baseModules.length} included · {addOnModules.length} optional
                </CardContent>
              </Card>
              <Card className="bg-muted/40 shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription>User seats</CardDescription>
                  <CardTitle className="text-2xl font-semibold">
                    {tenant.activeUserCount}/{tenant.userCount}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Active vs total users in workspace
                </CardContent>
              </Card>
              <Card className="bg-muted/40 shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription>Last active</CardDescription>
                  <CardTitle className="text-base font-semibold">{lastActive}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Monitored from telemetry events
                </CardContent>
              </Card>
              <Card className="bg-muted/40 shadow-none">
                <CardHeader className="pb-2">
                  <CardDescription>Plan</CardDescription>
                  <CardTitle className="text-base font-semibold">
                    {tenant.billing.planName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Status {tenant.billing.status.toLowerCase()} · MRR $
                  {tenant.billing.monthlyRecurringRevenue.toLocaleString()}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="modules" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Included modules</CardTitle>
            <CardDescription>Core features that every tenant receives by default.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {baseModules.length ? (
              baseModules.map(({ assignment, definition }) => (
                <div
                  key={assignment.moduleId}
                  className="flex flex-col gap-2 rounded-md border bg-muted/40 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {definition?.name ?? assignment.moduleName}
                    </p>
                    <Badge variant="secondary">Included</Badge>
                  </div>
                  {definition?.description && (
                    <p className="text-xs text-muted-foreground">{definition.description}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No core modules found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optional add-ons</CardTitle>
            <CardDescription>
              Enable extra capabilities tailored to the tenant&apos;s needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {addOnModules.length ? (
              addOnModules.map(({ assignment, definition }) => (
                <div
                  key={assignment.moduleId}
                  className="flex items-start justify-between gap-4 rounded-md border p-4"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {definition?.name ?? assignment.moduleName}
                    </p>
                    {definition?.description && (
                      <p className="text-xs text-muted-foreground">{definition.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {assignment.enabledAt
                        ? `Enabled ${new Date(assignment.enabledAt).toLocaleDateString()}`
                        : 'Currently disabled'}
                    </p>
                  </div>
                  <Switch
                    checked={assignment.isEnabled}
                    onCheckedChange={(checked) =>
                      onToggleModule(assignment.moduleId, Boolean(checked))
                    }
                    disabled={togglingModuleId === assignment.moduleId}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No optional modules are available for this tenant right now.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-muted/40 shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>Total users</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                <UsersRound className="h-5 w-5 text-primary" /> {users.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {activeUsers} active · {invitedUsers} invited · {suspendedUsers} suspended
            </CardContent>
          </Card>
          <Card className="bg-muted/40 shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>Active users</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                <Badge variant="secondary" className="px-2 py-1 text-base">
                  {activeUsers}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Users fully onboarded in the workspace
            </CardContent>
          </Card>
          <Card className="bg-muted/40 shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>Pending invitations</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                <Clock3 className="h-5 w-5 text-primary" /> {invitedUsers}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Send reminders or revoke access from the actions menu
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Tenant users</CardTitle>
              <CardDescription>
                All users provisioned under this tenant workspace. Use the connect action to launch
                a tenant session in a separate tab (ideally an incognito window).
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Plus className="h-4 w-4" /> Invite user
            </Button>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-14 w-full animate-pulse rounded-md bg-muted/60" />
                ))}
              </div>
            ) : users.length ? (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const isSuspending = actingUserId === user.id;
                      const isResetting = resettingUserId === user.id;

                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            {`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '—'}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="uppercase">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.status === 'SUSPENDED' ? 'destructive' : 'outline'}
                            >
                              {user.status.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.lastLoginAt
                              ? new Date(user.lastLoginAt).toLocaleString()
                              : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="gap-2"
                                  onClick={() => onImpersonateUser(user)}
                                  disabled={Boolean(
                                    impersonatingUserId && impersonatingUserId !== user.id
                                  )}
                                >
                                  {impersonatingUserId === user.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                  ) : (
                                    <LogIn className="h-4 w-4" />
                                  )}
                                  Connect as user
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2"
                                  onClick={() => onResetPassword(user)}
                                  disabled={isResetting}
                                >
                                  {isResetting && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                  )}
                                  <RefreshCcw className="h-4 w-4" /> Reset password
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2 text-destructive focus:text-destructive"
                                  onClick={() => onSuspendUser(user)}
                                  disabled={user.status === 'SUSPENDED' || isSuspending}
                                >
                                  {isSuspending && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                  )}
                                  <ShieldAlert className="h-4 w-4" /> Suspend user
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No users found for this tenant.
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="billing">
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Subscription and invoicing details for this tenant.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Plan</p>
              <p className="text-sm font-semibold">{tenant.billing.planName}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Renewal</p>
              <p className="text-sm font-semibold">
                {tenant.billing.renewalDate
                  ? new Date(tenant.billing.renewalDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">MRR</p>
              <p className="text-sm font-semibold">
                ${tenant.billing.monthlyRecurringRevenue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Payment status</p>
              <Badge variant="outline" className="capitalize">
                {tenant.billing.status.toLowerCase()}
              </Badge>
            </div>
            {tenant.billing.stripeCustomerId && (
              <div>
                <p className="text-xs uppercase text-muted-foreground">Stripe customer</p>
                <p className="text-sm font-semibold">{tenant.billing.stripeCustomerId}</p>
              </div>
            )}
            {tenant.billing.stripeSubscriptionId && (
              <div>
                <p className="text-xs uppercase text-muted-foreground">Stripe subscription</p>
                <p className="text-sm font-semibold">{tenant.billing.stripeSubscriptionId}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
