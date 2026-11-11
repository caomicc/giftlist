import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { formatCurrency, getUserLocale, getUserCurrency } from '@/lib/currency';
import { useTranslation, formatMessage } from './i18n-provider';

interface GiftCardPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  giftItem: {
    id: string;
    name: string;
    gift_card_target_amount?: number | string | null;
    gift_card_total_purchased?: number | string;
  };
  currentUserId: string;
  /** Records the contribution. Should throw on failure so the dialog stays open. */
  onPurchase: (amount: number) => Promise<void>;
}

const GiftCardPurchaseDialog: React.FC<GiftCardPurchaseDialogProps> = ({
  isOpen,
  onClose,
  giftItem,
  onPurchase,
}) => {
  const { t } = useTranslation('gifts');
  const tDialog = t.giftCard?.purchaseDialog || {};
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locale = getUserLocale();
  const currency = getUserCurrency(locale);
  const money = (value: number) => formatCurrency(value, currency, locale);

  const totalPurchased = parseFloat(giftItem.gift_card_total_purchased?.toString() || '0') || 0;
  const targetAmount = parseFloat(giftItem.gift_card_target_amount?.toString() || '0') || null;
  const remaining = targetAmount && targetAmount > 0 ? Math.max(targetAmount - totalPurchased, 0) : null;

  const parsedAmount = parseFloat(amount);
  const hasAmount = !!amount && !isNaN(parsedAmount) && parsedAmount > 0;
  const isOverRemaining = remaining !== null && hasAmount && parsedAmount > remaining + 0.005;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!hasAmount || isOverRemaining) return;

    setIsSubmitting(true);
    try {
      await onPurchase(parsedAmount);
      setAmount('');
      onClose();
    } catch (error) {
      // The caller shows the error toast; keep the dialog open so the amount isn't lost
      console.error('Failed to record contribution:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tDialog.title || 'Record a contribution'}</DialogTitle>
          <DialogDescription>
            {formatMessage(
              tDialog.description || "Record what you're putting toward {{name}}. No payment happens here: you buy the card yourself.",
              { name: giftItem.name }
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{tDialog.totalLabel || 'Contributed so far'}</dt>
              <dd className="font-medium tabular-nums">{money(totalPurchased)}</dd>
            </div>
            {targetAmount && targetAmount > 0 && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{tDialog.targetLabel || 'Target'}</dt>
                  <dd className="font-medium tabular-nums">{money(targetAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{tDialog.remainingLabel || 'Left to go'}</dt>
                  <dd className="font-medium tabular-nums">{money(remaining ?? 0)}</dd>
                </div>
                <Progress
                  value={Math.min((totalPurchased / targetAmount) * 100, 100)}
                  aria-label={tDialog.totalLabel || 'Contributed so far'}
                />
              </>
            )}
          </dl>

          <div className="grid gap-2">
            <Label htmlFor={`gift-card-amount-${giftItem.id}`}>
              {formatMessage(tDialog.amountLabel || 'Your amount ({{currency}})', { currency })}
            </Label>
            <Input
              id={`gift-card-amount-${giftItem.id}`}
              type="number"
              inputMode="decimal"
              min="0"
              max={remaining ?? undefined}
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
              aria-invalid={isOverRemaining || undefined}
              aria-describedby={isOverRemaining ? `gift-card-amount-error-${giftItem.id}` : undefined}
              autoFocus
            />
            {isOverRemaining && (
              <p id={`gift-card-amount-error-${giftItem.id}`} className="text-sm text-destructive">
                {formatMessage(tDialog.overRemaining || "That's more than the {{amount}} left to go", { amount: money(remaining ?? 0) })}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {tDialog.cancelButton || 'Cancel'}
            </Button>
            <Button type="submit" disabled={!hasAmount || isOverRemaining || isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isSubmitting
                ? (tDialog.submittingButton || 'Saving…')
                : formatMessage(tDialog.submitWithAmount || 'Record {{amount}}', { amount: money(hasAmount ? parsedAmount : 0) })}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GiftCardPurchaseDialog;
