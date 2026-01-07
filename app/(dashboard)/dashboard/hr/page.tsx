'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HRPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          HR Management
          <Badge variant="secondary" className="ml-3">Optional Module</Badge>
        </h1>
        <p className="text-muted-foreground">
          Manage employees, payroll, and attendance
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            HR management features will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
