'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export default function SuperAdminSupportPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Owner Support</h1>
        <p className="text-sm text-muted-foreground">
          Need help? Reach out to the engineering team or review platform documentation for advanced
          configuration support.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Engineering</CardTitle>
          <CardDescription>
            Escalate incidents or request new features for the SaaS control plane.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>Email: support@yourcompany.com</p>
          <Button asChild>
            <a href="mailto:support@yourcompany.com">
              <Mail className="mr-2 h-4 w-4" />
              Send email
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
