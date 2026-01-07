'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderStatusesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical, Pencil, Check, X, ListOrdered, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OrderStatus {
  id: string;
  name: string;
  slug: string;
  color: string;
  position: number;
  isSystem: boolean;
  isActive: boolean;
}

export default function OrderStatusesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusSlug, setNewStatusSlug] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3b82f6');
  const [showAddForm, setShowAddForm] = useState(false);
  const [draggedItem, setDraggedItem] = useState<OrderStatus | null>(null);

  const { data: statuses = [], isLoading, error } = useQuery({
    queryKey: ['order-statuses'],
    queryFn: orderStatusesApi.getAll,
  });

  console.log('Order Statuses Query:', { statuses, isLoading, error });

  const createMutation = useMutation({
    mutationFn: orderStatusesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-statuses'] });
      toast.success(t('orderStatuses.createSuccess') || 'Status created successfully');
      setNewStatusName('');
      setNewStatusSlug('');
      setNewStatusColor('#3b82f6');
      setShowAddForm(false);
    },
    onError: () => {
      toast.error(t('orderStatuses.createError') || 'Failed to create status');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => orderStatusesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-statuses'] });
      toast.success(t('orderStatuses.updateSuccess') || 'Status updated successfully');
      setEditingId(null);
    },
    onError: () => {
      toast.error(t('orderStatuses.updateError') || 'Failed to update status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: orderStatusesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-statuses'] });
      toast.success(t('orderStatuses.deleteSuccess') || 'Status deleted successfully');
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('orderStatuses.deleteError') || 'Failed to delete status');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: orderStatusesApi.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-statuses'] });
      toast.success(t('orderStatuses.reorderSuccess') || 'Statuses reordered successfully');
    },
    onError: () => {
      toast.error(t('orderStatuses.reorderError') || 'Failed to reorder statuses');
    },
  });

  const handleAdd = () => {
    if (!newStatusName) {
      toast.error(t('orderStatuses.nameRequired') || 'Name is required');
      return;
    }
    
    // Auto-generate slug if not provided
    const slug = newStatusSlug || newStatusName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    createMutation.mutate({
      name: newStatusName,
      slug: slug,
      color: newStatusColor,
    });
  };

  const handleEdit = (status: OrderStatus) => {
    setEditingId(status.id);
    setEditName(status.name);
    setEditColor(status.color);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      data: { name: editName, color: editColor },
    });
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateMutation.mutate({
      id,
      data: { isActive: !isActive },
    });
  };

  const handleDragStart = (status: OrderStatus) => {
    setDraggedItem(status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStatus: OrderStatus) => {
    if (!draggedItem || draggedItem.id === targetStatus.id) return;

    const sortedStatuses = [...statuses].sort((a, b) => a.position - b.position);
    const draggedIndex = sortedStatuses.findIndex(s => s.id === draggedItem.id);
    const targetIndex = sortedStatuses.findIndex(s => s.id === targetStatus.id);

    sortedStatuses.splice(draggedIndex, 1);
    sortedStatuses.splice(targetIndex, 0, draggedItem);

    const newOrder = sortedStatuses.map(s => s.id);
    reorderMutation.mutate(newOrder);
    setDraggedItem(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/settings')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back') || 'Back'}
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

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
                <ListOrdered className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t('orderStatuses.title') || 'Order Statuses'}
              </h1>
            </div>
            <p className="text-muted-foreground ml-14">
              {t('orderStatuses.description') || 'Manage your order lifecycle and workflow'}
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            {t('orderStatuses.addStatus') || 'Add Status'}
          </Button>
        </div>
      </div>

      <Separator />

      {showAddForm && (
        <Card className="border-primary/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t('orderStatuses.newStatus') || 'New Status'}</CardTitle>
            <CardDescription>
              {t('orderStatuses.newStatusDescription') || 'Add a new status to your order workflow'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-name" className="text-sm font-medium">
                  {t('orderStatuses.name') || 'Name'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="new-name"
                  value={newStatusName}
                  onChange={(e) => {
                    setNewStatusName(e.target.value);
                    // Auto-generate slug as user types
                    setNewStatusSlug(e.target.value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder={t('orderStatuses.namePlaceholder') || 'e.g., In Transit'}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-color" className="text-sm font-medium">
                  {t('orderStatuses.color') || 'Color'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="new-color"
                    type="color"
                    value={newStatusColor}
                    onChange={(e) => setNewStatusColor(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={newStatusColor}
                    onChange={(e) => setNewStatusColor(e.target.value)}
                    placeholder={t('orderStatuses.colorPlaceholder') || '#3b82f6'}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Button onClick={handleAdd} disabled={createMutation.isPending} size="default">
                <Check className="h-4 w-4 mr-2" />
                {t('common.create') || 'Create'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} size="default">
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel') || 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('orderStatuses.currentStatuses') || 'Current Statuses'}</CardTitle>
          <CardDescription>
            {t('orderStatuses.dragToReorder') || 'Drag to reorder, click to edit'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {statuses
              .sort((a: OrderStatus, b: OrderStatus) => a.position - b.position)
              .map((status: OrderStatus) => (
                <div
                  key={status.id}
                  draggable={!status.isSystem}
                  onDragStart={() => handleDragStart(status)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(status)}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {!status.isSystem && (
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  )}
                  
                  {editingId === status.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs"
                      />
                      <Input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-20"
                      />
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge
                        style={{ backgroundColor: status.color }}
                        className="text-white"
                      >
                        {status.isSystem ? t(`orderStatuses.systemStatuses.${status.slug}`) || status.name : status.name}
                      </Badge>
                      {status.isSystem && (
                        <Badge variant="outline" className="text-xs">
                          {t('orderStatuses.system') || 'System'}
                        </Badge>
                      )}
                      <div className="flex-1" />
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">{t('orderStatuses.active') || 'Active'}</Label>
                        <Switch
                          checked={status.isActive}
                          onCheckedChange={() => handleToggleActive(status.id, status.isActive)}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(status)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!status.isSystem && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(status.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('orderStatuses.deleteTitle') || 'Delete Status'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('orderStatuses.deleteConfirm') || 'Are you sure you want to delete this status? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground"
            >
              {t('common.delete') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
