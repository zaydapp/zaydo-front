'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InvoiceFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function InvoiceFormSection({ title, description, children, className }: InvoiceFormSectionProps) {
  return (
    <Card className={cn('shadow-md rounded-xl', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription className="text-sm mt-1">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}

