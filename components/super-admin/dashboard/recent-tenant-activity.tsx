'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface TenantActivityItem {
  id: string;
  tenantName: string;
  userCount: number;
  revenue: number;
  paymentMethod: string;
  status: 'active' | 'trial' | 'suspended' | 'new';
}

interface RecentTenantActivityProps {
  data?: TenantActivityItem[];
  isLoading?: boolean;
}

// Mock data for demonstration
const mockData: TenantActivityItem[] = [
  {
    id: '1083',
    tenantName: 'Marvin Dekidis',
    userCount: 2,
    revenue: 34.5,
    paymentMethod: 'E-Wallet',
    status: 'new',
  },
  {
    id: '1082',
    tenantName: 'Carter Lipshitz',
    userCount: 6,
    revenue: 60.5,
    paymentMethod: 'Bank Transfer',
    status: 'trial',
  },
  {
    id: '1081',
    tenantName: 'Addison Philips',
    userCount: 3,
    revenue: 47.5,
    paymentMethod: 'E-Wallet',
    status: 'new',
  },
  {
    id: '1079',
    tenantName: 'Craig Siphron',
    userCount: 15,
    revenue: 89.8,
    paymentMethod: 'Bank Transfer',
    status: 'suspended',
  },
  {
    id: '1078',
    tenantName: 'Emerson Gouse',
    userCount: 4,
    revenue: 102.75,
    paymentMethod: 'Credit Card',
    status: 'active',
  },
];

export function RecentTenantActivity({ data = mockData, isLoading }: RecentTenantActivityProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      new: { label: 'New Order', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
      trial: { label: 'In Progress', className: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
      active: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
      suspended: { label: 'On Hold', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' },
    };

    const variant = variants[status] || variants.new;
    return (
      <Badge variant="secondary" className={`${variant.className} rounded-full font-medium`}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Filter orders..."
            className="h-9 w-[250px] bg-background"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                Columns
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>ID</DropdownMenuItem>
              <DropdownMenuItem>Customer Name</DropdownMenuItem>
              <DropdownMenuItem>Qty Items</DropdownMenuItem>
              <DropdownMenuItem>Amount</DropdownMenuItem>
              <DropdownMenuItem>Payment Method</DropdownMenuItem>
              <DropdownMenuItem>Status</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="h-12 flex-1 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Customer Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Qty Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Payment Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">{item.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{item.tenantName}</td>
                    <td className="px-4 py-3 text-sm">{item.userCount} Items</td>
                    <td className="px-4 py-3 text-sm">${item.revenue.toFixed(1)}</td>
                    <td className="px-4 py-3 text-sm">{item.paymentMethod}</td>
                    <td className="px-4 py-3 text-sm">{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
