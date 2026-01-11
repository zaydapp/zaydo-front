'use client';

import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Lock, X } from 'lucide-react';
import { useTenantSettings, useUpdateSetting, useDeleteSetting } from '@/hooks/useTenantSettings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { TenantSetting } from '@/types';

interface SettingsListProps {
  category: string;
}

export function SettingsList({ category }: SettingsListProps) {
  const { t } = useTranslation();
  const { data: settingsData, isLoading } = useTenantSettings(category);
  const updateSetting = useUpdateSetting();
  const deleteSetting = useDeleteSetting();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentSetting, setCurrentSetting] = useState<TenantSetting | null>(null);
  const [editValue, setEditValue] = useState<
    string | number | Record<string, string | number> | Array<Record<string, unknown>> | null
  >(null);
  const [editItems, setEditItems] = useState<Array<Record<string, unknown>>>([]);

  const settings = (settingsData || []) as TenantSetting[];

  const handleEdit = (setting: TenantSetting) => {
    if (setting.isSystem) {
      toast.error(t('settingsPage.cannotModify'));
      return;
    }
    setCurrentSetting(setting);
    setEditValue(setting.value as string | number | Record<string, string | number> | null);

    // Convert value to editable format
    if (Array.isArray(setting.value)) {
      if (typeof setting.value[0] === 'object') {
        setEditItems(setting.value);
      } else {
        setEditItems(setting.value.map((item) => ({ value: item })));
      }
    } else {
      setEditItems([]);
    }

    setEditDialogOpen(true);
  };

  const handleAddItem = () => {
    const isComplex = editItems.length > 0 && editItems[0].label !== undefined;
    const newItem = isComplex ? { value: '', label: '' } : { value: '' };
    setEditItems([...editItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number | boolean) => {
    const newItems = [...editItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditItems(newItems);
  };

  const handleDelete = (setting: TenantSetting) => {
    if (setting.isSystem) {
      toast.error(t('settingsPage.cannotModify'));
      return;
    }
    setCurrentSetting(setting);
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentSetting) return;

    try {
      let finalValue:
        | string
        | number
        | Record<string, string | number>
        | Array<Record<string, unknown>>
        | null = editValue;

      // Convert items back to proper format
      if (editItems.length > 0) {
        if (editItems[0].label !== undefined) {
          // Complex objects (clients, products, etc.)
          finalValue = editItems.filter((item) => item.value || item.label) as Record<
            string,
            unknown
          >[];
        } else {
          // Simple arrays (units)
          finalValue = editItems
            .map((item) => item.value)
            .filter((v) => v && String(v).trim()) as unknown as Array<Record<string, unknown>>;
        }
      }

      await updateSetting.mutateAsync({
        key: currentSetting.key,
        data: { value: finalValue },
      });
      toast.success(t('settingsPage.settingUpdated'));
      setEditDialogOpen(false);
      setCurrentSetting(null);
      setEditItems([]);
    } catch (error) {
      console.error('Failed to update setting:', error);
      toast.error(t('settingsPage.updateError') || 'Failed to update setting');
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentSetting) return;

    try {
      await deleteSetting.mutateAsync(currentSetting.key);
      toast.success(t('settingsPage.settingDeleted'));
      setDeleteDialogOpen(false);
      setCurrentSetting(null);
    } catch (error) {
      console.error('Failed to delete setting:', error);
      toast.error(t('settingsPage.deleteError') || 'Failed to delete setting');
    }
  };

  const renderValue = (
    value: string | number | Record<string, unknown> | Array<Record<string, unknown>> | unknown[],
    category: string
  ) => {
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => {
            let displayText = '';
            if (typeof item === 'object') {
              displayText = item.label || item.value || item.name;
              // Try to translate the value
              const valueKey = (item.value || item.label || item.name || '')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_');
              const translationKey = `settingsPage.settingValues.${category}.${valueKey}`;
              const translated = t(translationKey);
              if (translated !== translationKey) {
                displayText = translated;
              }
            } else {
              displayText = String(item);
              // Try to translate simple string values
              const valueKey = String(item)
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_');
              const translationKey = `settingsPage.settingValues.${category}.${valueKey}`;
              const translated = t(translationKey);
              if (translated !== translationKey) {
                displayText = translated;
              }
            }
            return (
              <Badge key={index} variant="secondary">
                {displayText}
              </Badge>
            );
          })}
        </div>
      );
    }
    if (typeof value === 'object' && value !== null) {
      // Display object properties in a readable format
      if (value.code && value.symbol) {
        // Currency format
        return (
          <span>
            {String(value.code)} ({String(value.symbol)})
          </span>
        );
      }
      return (
        <div className="text-sm space-y-1">
          {Object.entries(value).map(([key, val]) => (
            <div key={key}>
              <span className="font-medium">{key}:</span> {String(val)}
            </div>
          ))}
        </div>
      );
    }
    return <span>{String(value)}</span>;
  };

  const renderEditDialog = () => {
    if (!currentSetting) return null;

    const isSimpleArray =
      Array.isArray(currentSetting.value) &&
      (currentSetting.value.length === 0 || typeof currentSetting.value[0] !== 'object');
    const isComplexArray =
      Array.isArray(currentSetting.value) &&
      currentSetting.value.length > 0 &&
      typeof currentSetting.value[0] === 'object';
    const isObject =
      !Array.isArray(currentSetting.value) && typeof currentSetting.value === 'object';

    return (
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('settingsPage.editValue')}</DialogTitle>
            <DialogDescription>{currentSetting.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Simple Array (units) */}
            {(isSimpleArray || (editItems.length > 0 && editItems[0].label === undefined)) && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>{t('settingsPage.valueLabel')}</Label>
                  <Button onClick={handleAddItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    {t('settingsPage.addValue')}
                  </Button>
                </div>
                {editItems.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={String(item.value || '')}
                      onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                      placeholder={t('settingsPage.enterValue')}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Complex Array (clients, products with label/value) */}
            {isComplexArray && editItems.length > 0 && editItems[0].label !== undefined && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>{t('settingsPage.addNewItem')}</Label>
                  <Button onClick={handleAddItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    {t('settingsPage.addValue')}
                  </Button>
                </div>
                {editItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        {t('settingsPage.itemNumber', { number: index + 1 }) || `Item ${index + 1}`}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">{t('settingsPage.valueLabel')}</Label>
                        <Input
                          value={String(item.value || '')}
                          onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                          placeholder={t('settingsPage.valuePlaceholder') || 'VALUE'}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t('settingsPage.labelLabel')}</Label>
                        <Input
                          value={String(item.label || '')}
                          onChange={(e) => handleItemChange(index, 'label', e.target.value)}
                          placeholder={t('settingsPage.labelPlaceholder') || 'Display Label'}
                        />
                      </div>
                    </div>
                    {item.rate !== undefined && (
                      <div>
                        <Label className="text-xs">{t('settingsPage.rateLabel')}</Label>
                        <Input
                          type="number"
                          value={Number(item.rate) || 0}
                          onChange={(e) =>
                            handleItemChange(index, 'rate', parseFloat(e.target.value))
                          }
                        />
                      </div>
                    )}
                    {item.days !== undefined && (
                      <div>
                        <Label className="text-xs">{t('settingsPage.daysLabel')}</Label>
                        <Input
                          type="number"
                          value={Number(item.days) || 0}
                          onChange={(e) =>
                            handleItemChange(index, 'days', parseInt(e.target.value))
                          }
                        />
                      </div>
                    )}
                    {item.isDefault !== undefined && (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={Boolean(item.isDefault)}
                          onCheckedChange={(checked) =>
                            handleItemChange(index, 'isDefault', checked)
                          }
                        />
                        <Label className="text-xs">{t('settingsPage.isDefaultLabel')}</Label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Object (currency, etc.) */}
            {isObject && (
              <div className="space-y-3">
                <Label>{t('settingsPage.valueLabel')}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(editValue as object).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs capitalize">{key}</Label>
                      <Input
                        value={String(value)}
                        onChange={(e) =>
                          setEditValue({
                            ...(editValue as Record<string, string | number>),
                            [key]: e.target.value,
                          } as Record<string, string | number>)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditItems([]);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateSetting.isPending}>
              {updateSetting.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('settingsPage.loadingSettings')}</div>;
  }

  if (!settings || settings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">{t('settingsPage.noSettings')}</div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.name')}</TableHead>
              <TableHead>{t('settingsPage.value')}</TableHead>
              <TableHead>{t('common.description')}</TableHead>
              <TableHead className="text-right">{t('settingsPage.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.map((setting) => (
              <TableRow key={setting.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {t(`settingsPage.settingKeys.${setting.key}`)}
                    {setting.isSystem && (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="h-3 w-3" />
                        {t('settingsPage.system')}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {renderValue(
                    setting.value as
                      | string
                      | number
                      | Record<string, unknown>
                      | Array<Record<string, unknown>>
                      | unknown[],
                    category
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {setting.description}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(setting)}
                      disabled={setting.isSystem}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(setting)}
                      disabled={setting.isSystem}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {renderEditDialog()}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settingsPage.deleteValue')}</DialogTitle>
            <DialogDescription>{t('settingsPage.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteSetting.isPending}
            >
              {deleteSetting.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
