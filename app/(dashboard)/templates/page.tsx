'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Settings, Eye, Copy, Edit, Trash2 } from 'lucide-react';
import { useTenant } from '@/contexts/tenant-context';

interface Template {
  id: string;
  name: string;
  description?: string;
  documentType: string;
  status: string;
  usageCount?: number;
  isDefault?: boolean;
}

export default function TemplatesPage() {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false); // TODO: set true when fetching templates from API

  const handleCreateTemplate = () => {
    // TODO: Navigate to template creation page
  };

  const handleEditTemplate = (templateId: string) => {
    // TODO: Navigate to template edit page
  };

  const handleDuplicateTemplate = (templateId: string) => {
    // TODO: Duplicate template
  };

  const handleDeleteTemplate = (templateId: string) => {
    // TODO: Delete template
  };

  const handlePreviewTemplate = (templateId: string) => {
    // TODO: Preview template
  };

  if (!tenant?.enabledModules?.includes('document-templating')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Module Not Available</CardTitle>
            <CardDescription>
              The Document Templating module is not enabled for your tenant. Please contact your
              administrator to enable this feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => (window.location.href = '/dashboard/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('templates.title', 'Templates')}</h1>
          <p className="text-muted-foreground">
            {t('templates.description', 'Manage your document templates')}
          </p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          {t('common.create', 'Create Template')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">{t('common.loading', 'Loading...')}</div>
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-center mb-2">
              {t('templates.noTemplates', 'No Templates Yet')}
            </CardTitle>
            <CardDescription className="text-center mb-6">
              {t('templates.noTemplatesDesc', 'Create your first document template to get started')}
            </CardDescription>
            <Button onClick={handleCreateTemplate} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              {t('templates.createFirst', 'Create Your First Template')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreviewTemplate(template.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('templates.type', 'Type')}:</span>
                    <span className="font-medium">{template.documentType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('templates.status', 'Status')}:
                    </span>
                    <span className="font-medium">{template.status}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('templates.usage', 'Usage')}:</span>
                    <span className="font-medium">{template.usageCount || 0}</span>
                  </div>
                  {template.isDefault && (
                    <div className="flex items-center text-sm text-primary">
                      <FileText className="h-4 w-4 mr-1" />
                      {t('templates.default', 'Default Template')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
