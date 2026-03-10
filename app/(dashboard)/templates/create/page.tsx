'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Save, Code, Settings, HelpCircle, RefreshCw } from 'lucide-react';
import { useTenant } from '@/contexts/tenant-context';

interface TemplateData {
  name: string;
  description: string;
  documentType: string;
  htmlContent: string;
  cssContent: string;
  isDefault: boolean;
}

const PLACEHOLDERS = {
  invoice: [
    { key: 'invoice.number', label: 'Invoice Number', example: 'INV-2024-001' },
    { key: 'invoice.issueDate', label: 'Issue Date', example: '2024-02-08' },
    { key: 'invoice.dueDate', label: 'Due Date', example: '2024-03-08' },
    { key: 'client.name', label: 'Client Name', example: 'Acme Corporation' },
    { key: 'client.email', label: 'Client Email', example: 'billing@acme.com' },
    {
      key: 'client.address',
      label: 'Client Address',
      example: '123 Business St, City, State 12345',
    },
    { key: 'items', label: 'Items (Loop)', example: '{{#each items}}...{{/each}}' },
    { key: 'totals.subtotal', label: 'Subtotal', example: '{{currency totals.subtotal}}' },
    {
      key: 'totals.totalAmount',
      label: 'Total Amount',
      example: '{{currency totals.totalAmount}}',
    },
    { key: 'tenant.name', label: 'Your Company Name', example: 'Your Company Inc.' },
    {
      key: 'tenant.address',
      label: 'Your Company Address',
      example: '456 Company Ave, City, State 67890',
    },
  ],
  quote: [
    { key: 'quote.number', label: 'Quote Number', example: 'Q-2024-001' },
    { key: 'quote.validUntil', label: 'Valid Until', example: '2024-03-08' },
  ],
};

export default function CreateTemplatePage() {
  const { t } = useTranslation();
  const { tenant } = useTenant();

  const [templateData, setTemplateData] = useState<TemplateData>({
    name: '',
    description: '',
    documentType: 'INVOICE',
    htmlContent: '',
    cssContent: '',
    isDefault: false,
  });

  const [previewHtml, setPreviewHtml] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const documentTypes = [
    { value: 'INVOICE', label: 'Invoice' },
    { value: 'QUOTE', label: 'Quote' },
    { value: 'CREDIT_NOTE', label: 'Credit Note' },
    { value: 'DELIVERY_NOTE', label: 'Delivery Note' },
    { value: 'PURCHASE_ORDER', label: 'Purchase Order' },
    { value: 'RECEIPT', label: 'Receipt' },
  ];

  const currentPlaceholders =
    PLACEHOLDERS[templateData.documentType.toLowerCase() as keyof typeof PLACEHOLDERS] || [];

  const handlePreview = async () => {
    try {
      const response = await fetch('/api/templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          htmlContent: templateData.htmlContent,
          cssContent: templateData.cssContent,
          previewData: generatePreviewData(),
        }),
      });

      if (response.ok) {
        const html = await response.text();
        setPreviewHtml(html);
        setActiveTab('preview');
      }
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const generatePreviewData = () => {
    return {
      invoice: {
        number: 'INV-2024-001',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      client: {
        name: 'Acme Corporation',
        email: 'billing@acme.com',
        address: '123 Business St, City, State 12345',
      },
      items: [
        {
          description: 'Sample Product/Service',
          quantity: 1,
          unitPrice: 100.0,
          totalAmount: 100.0,
        },
      ],
      totals: {
        subtotal: 100.0,
        taxAmount: 20.0,
        totalAmount: 120.0,
      },
      tenant: {
        name: tenant?.name || 'Your Company Inc.',
        address: '456 Company Ave, City, State 67890',
      },
    };
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        // Handle success - maybe redirect to templates list
        window.location.href = '/dashboard/templates';
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const insertPlaceholder = (placeholder: { key: string; label: string; example: string }) => {
    const textarea = document.getElementById('html-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = placeholder.example;

      setTemplateData((prev) => ({
        ...prev,
        htmlContent: prev.htmlContent.substring(0, start) + text + prev.htmlContent.substring(end),
      }));

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    }
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('templates.create', 'Create Template')}
          </h1>
          <p className="text-muted-foreground">
            {t('templates.createDesc', 'Design custom document templates with live preview')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowPlaceholders(!showPlaceholders)}>
            <Code className="h-4 w-4 mr-2" />
            {showPlaceholders ? 'Hide' : 'Show'} Placeholders
          </Button>
          <Button onClick={handlePreview} disabled={!templateData.htmlContent}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Template Editor</CardTitle>
            <CardDescription>
              Design your template using HTML and CSS with Handlebars placeholders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('templates.name', 'Template Name')}</Label>
                <Input
                  id="name"
                  value={templateData.name}
                  onChange={(e) => setTemplateData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t('templates.namePlaceholder', 'Enter template name...')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentType">{t('templates.documentType', 'Document Type')}</Label>
                <Select
                  value={templateData.documentType}
                  onValueChange={(value) =>
                    setTemplateData((prev) => ({ ...prev, documentType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('templates.selectType', 'Select document type')} />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('templates.description', 'Description')}</Label>
              <Textarea
                id="description"
                value={templateData.description}
                onChange={(e) =>
                  setTemplateData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder={t('templates.descriptionPlaceholder', 'Describe your template...')}
                rows={3}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">HTML Editor</TabsTrigger>
                <TabsTrigger value="css">CSS Editor</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="mt-4">
                <div className="relative">
                  <Textarea
                    id="html-editor"
                    value={templateData.htmlContent}
                    onChange={(e) =>
                      setTemplateData((prev) => ({ ...prev, htmlContent: e.target.value }))
                    }
                    placeholder={t('templates.htmlPlaceholder', 'Enter your HTML template...')}
                    className="min-h-[400px] font-mono text-sm"
                  />
                  {showPlaceholders && (
                    <div className="absolute right-4 top-4 w-80 max-h-96 overflow-y-auto bg-background border rounded-lg shadow-lg p-4 z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          {t('templates.placeholders', 'Available Placeholders')}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPlaceholders(false)}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {currentPlaceholders.map((placeholder) => (
                          <div
                            key={placeholder.key}
                            className="p-3 border rounded hover:bg-muted/50 cursor-pointer"
                            onClick={() => insertPlaceholder(placeholder)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <Badge variant="secondary" className="text-xs">
                                  {placeholder.key}
                                </Badge>
                              </div>
                              <span className="text-sm font-medium">{placeholder.label}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {placeholder.example}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="css" className="mt-4">
                <Textarea
                  value={templateData.cssContent}
                  onChange={(e) =>
                    setTemplateData((prev) => ({ ...prev, cssContent: e.target.value }))
                  }
                  placeholder={t('templates.cssPlaceholder', 'Enter custom CSS (optional)...')}
                  className="min-h-[400px] font-mono text-sm"
                />
              </TabsContent>
            </Tabs>

            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                id="isDefault"
                checked={templateData.isDefault}
                onChange={(e) =>
                  setTemplateData((prev) => ({ ...prev, isDefault: e.target.checked }))
                }
                className="h-4 w-4"
              />
              <Label htmlFor="isDefault" className="text-sm">
                {t('templates.isDefault', 'Set as default template')}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Live Preview</CardTitle>
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <CardDescription>
              {t('templates.previewDesc', 'See how your template will look with sample data')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg min-h-[600px] bg-white">
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                  title="Template Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">
                      {t('templates.noPreview', 'No preview available')}
                    </p>
                    <p className="text-sm">
                      {t(
                        'templates.noPreviewDesc',
                        'Add HTML content and click Preview to see the result'
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2" />
            {t('templates.help', 'Template Help')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">
                {t('templates.handlebarsSyntax', 'Handlebars Syntax')}
              </h4>
              <code className="block bg-muted p-2 rounded text-xs">
                {'{{variable}} - Simple variable'}
                <br />
                {'{{#each items}}...{{/each}} - Loop'}
                <br />
                {'{{#if condition}}...{{/if}} - Conditional'}
              </code>
            </div>
            <div>
              <h4 className="font-medium mb-2">
                {t('templates.availableHelpers', 'Available Helpers')}
              </h4>
              <ul className="space-y-1 text-xs">
                <li>
                  <code>{'{{currency amount "€" "after"}}'}</code> - Format currency
                </li>
                <li>
                  <code>{'{{formatDate date "dd.MM.yyyy"}}'}</code> - Format dates
                </li>
                <li>
                  <code>{'{{math value1 "+" value2}}'}</code> - Math operations
                </li>
                <li>
                  <code>{'{{#if (gt value 100)}}...{{/if}}'}</code> - Comparisons
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
