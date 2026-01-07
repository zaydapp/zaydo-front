'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceNumberingRules } from '@/components/settings/billing/invoice-numbering-rules';

export default function InvoiceNumberingSettingsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 pb-8">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <InvoiceNumberingRules showHeader />
    </div>
  );
}

