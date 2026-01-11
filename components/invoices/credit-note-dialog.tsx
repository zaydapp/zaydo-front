/*eslint-disable*/
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useCurrency } from '@/hooks/use-currency';
import { Invoice } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface CreditNoteItem {
  itemId: string;
  selected: boolean;
  quantity: number;
  reason: string;
}

interface CreditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onConfirm: (data: {
    items: Array<{
      itemId: string;
      quantity: number;
      reason: string;
    }>;
    reason: string;
    notes?: string;
  }) => void;
  isCreating?: boolean;
}

export function CreditNoteDialog({
  open,
  onOpenChange,
  invoice,
  onConfirm,
  isCreating = false,
}: CreditNoteDialogProps) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const [selectedItems, setSelectedItems] = useState<Record<string, CreditNoteItem>>({});
  const [globalReason, setGlobalReason] = useState('');
  const [notes, setNotes] = useState('');

  // Initialize selected items
  const initializeItems = () => {
    const items: Record<string, CreditNoteItem> = {};
    invoice.items?.forEach((item) => {
      items[item.id] = {
        itemId: item.id,
        selected: false,
        quantity: item.quantity,
        reason: '',
      };
    });
    setSelectedItems(items);
  };

  // Initialize when dialog opens
  useEffect(() => {
    if (open) {
      initializeItems();
      setGlobalReason('');
      setNotes('');
    }
  }, [open]);

  const handleItemToggle = (itemId: string, checked: boolean) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: checked,
      },
    }));
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const item = invoice.items?.find((i) => i.id === itemId);
    if (!item) return;
    const maxQuantity = item.quantity;
    const newQuantity = Math.max(0, Math.min(quantity, maxQuantity));

    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: newQuantity,
        selected: newQuantity > 0,
      },
    }));
  };

  const handleReasonChange = (itemId: string, reason: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        reason,
      },
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedItems).every((item) => item.selected);
    setSelectedItems((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((itemId) => {
        updated[itemId] = {
          ...updated[itemId],
          selected: !allSelected,
        };
      });
      return updated;
    });
  };

  const selectedItemsList = Object.values(selectedItems).filter(
    (item) => item.selected && item.quantity > 0
  );
  const canCreate = selectedItemsList.length > 0 && globalReason.trim().length > 0;

  const handleConfirm = () => {
    const items = selectedItemsList.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      reason: item.reason || globalReason,
    }));

    onConfirm({
      items,
      reason: globalReason,
      notes: notes.trim() || undefined,
    });
  };

  const totalCreditAmount = selectedItemsList.reduce((sum, creditItem) => {
    const invoiceItem = invoice.items?.find((i) => i.id === creditItem.itemId);
    if (!invoiceItem) return sum;
    const itemTotal = invoiceItem.unitPrice * creditItem.quantity;
    const itemDiscount = (invoiceItem.discount || 0) * (creditItem.quantity / invoiceItem.quantity);
    const itemTaxable = itemTotal - itemDiscount;
    const itemTax = (itemTaxable * (invoiceItem.taxRate || 0)) / 100;
    return sum + itemTaxable + itemTax;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[90vh] overflow-hidden p-0 gap-0 flex flex-col [&>div]:w-full">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">
            {t('invoices.createCreditNote') || 'Créer un Avoir'}
          </DialogTitle>
          <DialogDescription className="text-sm mt-2">
            {t('invoices.createCreditNoteDesc') ||
              'Sélectionnez les articles à créditer et indiquez la raison'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6 overflow-y-auto flex-1">
          {/* Header Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t('invoices.invoiceNumber') || 'Invoice Number'}
              </p>
              <p className="text-sm font-semibold">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t('invoices.totalAmount') || 'Total Amount'}
              </p>
              <p className="text-sm font-semibold">{format(invoice.totalAmount || 0)}</p>
            </div>
          </div>

          {/* Global Reason and Notes in Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="globalReason" className="text-sm font-medium">
                {t('invoices.creditNoteReason') || 'Raison du crédit'} *
              </Label>
              <Input
                id="globalReason"
                value={globalReason}
                onChange={(e) => setGlobalReason(e.target.value)}
                placeholder={
                  t('invoices.creditNoteReasonPlaceholder') ||
                  'Ex: Retour de marchandise, Erreur de facturation...'
                }
                className="mt-1.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                {t('invoices.notes') || 'Notes'}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  t('invoices.creditNoteNotesPlaceholder') ||
                  'Notes supplémentaires sur cet avoir...'
                }
                rows={3}
                className="mt-1.5 resize-none"
              />
            </div>
          </div>

          <Separator />

          {/* Items Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {t('invoices.selectItemsToCredit') || 'Articles à créditer'}
              </Label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs">
                {t('invoices.selectAll') || 'Tout sélectionner'}
              </Button>
            </div>

            <div className="border rounded-lg overflow-x-auto shadow-sm">
              <div className="grid grid-cols-[60px_minmax(200px,1fr)_120px_140px_160px_140px] gap-4 items-center py-3 px-4 bg-muted/50 border-b min-w-max">
                <div className="text-xs font-semibold"></div>
                <div className="text-xs font-semibold">{t('orders.product') || 'Produit'}</div>
                <div className="text-xs font-semibold text-right">
                  {t('orders.quantity') || 'Quantité'}
                </div>
                <div className="text-xs font-semibold text-right">
                  {t('orders.unitPrice') || 'Prix Unitaire'}
                </div>
                <div className="text-xs font-semibold text-right">
                  {t('invoices.creditQuantity') || 'Qté à créditer'}
                </div>
                <div className="text-xs font-semibold text-right">
                  {t('invoices.lineTotal') || 'Total Ligne'}
                </div>
              </div>

              <div className="divide-y min-w-max">
                {invoice.items?.map((item) => {
                  const creditItem = selectedItems[item.id] || {
                    itemId: item.id,
                    selected: false,
                    quantity: 0,
                    reason: '',
                  };
                  const itemTotal = item.unitPrice * item.quantity;
                  const itemDiscount = item.discount || 0;
                  const itemTaxable = itemTotal - itemDiscount;
                  const itemTax = (itemTaxable * (item.taxRate || 0)) / 100;
                  const itemTotalWithTax = itemTaxable + itemTax;

                  const creditItemTotal = creditItem.quantity * item.unitPrice;
                  const creditItemDiscount =
                    (item.discount || 0) * (creditItem.quantity / item.quantity);
                  const creditItemTaxable = creditItemTotal - creditItemDiscount;
                  const creditItemTax = (creditItemTaxable * (item.taxRate || 0)) / 100;
                  const creditItemTotalWithTax = creditItemTaxable + creditItemTax;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'grid grid-cols-[60px_minmax(200px,1fr)_120px_140px_160px_140px] gap-4 items-center py-3 px-4 transition-colors min-w-full',
                        creditItem.selected
                          ? 'bg-primary/5 hover:bg-primary/10'
                          : 'hover:bg-muted/30'
                      )}
                    >
                      <Checkbox
                        checked={creditItem.selected}
                        onCheckedChange={(checked) => handleItemToggle(item.id, checked as boolean)}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.description}</p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {item.notes}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t('invoices.originalTotal') || 'Total original'}:{' '}
                          {format(itemTotalWithTax)}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <span className="font-medium">{item.quantity}</span>
                        <span className="text-muted-foreground ml-1">{item.unit}</span>
                      </div>
                      <div className="text-right text-sm font-medium">{format(item.unitPrice)}</div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={item.quantity}
                          step="0.01"
                          value={creditItem.quantity}
                          onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                          className={cn(
                            'h-9 text-sm text-right font-medium',
                            creditItem.selected && creditItem.quantity > 0 && 'border-primary'
                          )}
                          disabled={!creditItem.selected}
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {item.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        {creditItem.selected && creditItem.quantity > 0 ? (
                          <span className="text-sm font-semibold text-destructive">
                            -{format(creditItemTotalWithTax)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary */}
          {selectedItemsList.length > 0 && (
            <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 border-2 border-destructive/20 rounded-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t('invoices.itemsSelected') || 'Articles sélectionnés'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedItemsList.length}{' '}
                    {selectedItemsList.length === 1
                      ? t('invoices.item') || 'article'
                      : t('invoices.items') || 'articles'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t('invoices.totalCreditAmount') || 'Montant total du crédit'}
                  </p>
                  <p className="font-bold text-2xl text-destructive">
                    -{format(totalCreditAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            {t('common.cancel') || 'Annuler'}
          </Button>
          <Button onClick={handleConfirm} disabled={!canCreate || isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.creating') || 'Création...'}
              </>
            ) : (
              t('invoices.createCreditNote') || "Créer l'avoir"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
