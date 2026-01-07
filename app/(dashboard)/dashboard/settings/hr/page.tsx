'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SettingsList } from '@/components/settings/settings-list';

export default function HRPage() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="space-y-6 pb-8">
      {/* Header with back button */}
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/settings')} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back') || 'Back to Settings'}
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t('settings.categories.hr') || 'HR Parameters'}
              </h1>
            </div>
            <p className="text-muted-foreground ml-14">
              {t('settings.categoryDescriptions.hr') || 'Employee roles, contract types, departments'}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.categories.hr') || 'HR Parameters'}</CardTitle>
          <CardDescription>
            {t('settings.hrDescription') || 'Manage employee settings and HR configurations'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsList category="hr" />
        </CardContent>
      </Card>
    </div>
  );
}
