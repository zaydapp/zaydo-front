'use client';

import { TenantSummary } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';

interface TenantTableProps {
  tenants: TenantSummary[];
  isLoading: boolean;
  onView: (tenant: TenantSummary) => void;
  onEdit: (tenant: TenantSummary) => void;
  onDeactivate: (tenant: TenantSummary) => void;
}

const statusVariantMap: Record<
  TenantSummary['status'],
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  ACTIVE: 'default',
  SUSPENDED: 'destructive',
  TRIAL: 'secondary',
  INACTIVE: 'outline',
};

export function TenantTable({
  tenants,
  isLoading,
  onView,
  onEdit,
  onDeactivate,
}: TenantTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-20 w-full animate-pulse rounded-md bg-muted/60" />
        ))}
      </div>
    );
  }

  if (!tenants.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No tenants found. Adjust your filters or onboard a new tenant.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => {
            const planLabel = tenant.currentPlanName ?? '—';
            const contactName = tenant.contact?.name || '—';
            const contactEmail = tenant.contact?.email || '—';

            return (
              <TableRow key={tenant.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold">{tenant.companyName}</p>
                    <p className="text-xs text-muted-foreground">{tenant.id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{tenant.slug}</div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{contactName}</p>
                    <p className="text-xs text-muted-foreground">{contactEmail}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="text-xs">
                      {planLabel}
                    </Badge>
                    {tenant.activeModuleKeys && tenant.activeModuleKeys.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {tenant.activeModuleKeys.length} modules
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariantMap[tenant.status]} className="capitalize">
                    {tenant.status.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(tenant)}>
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(tenant)}>
                        Edit tenant
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDeactivate(tenant)}
                      >
                        {tenant.status === 'SUSPENDED' ? 'Activate tenant' : 'Deactivate tenant'}
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
  );
}
