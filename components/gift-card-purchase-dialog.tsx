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
import { Loader2, DollarSign } from 'lucide-react';

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
  onPurchase: (amount: number) => Promise<void>;
}

const GiftCardPurchaseDialog: React.FC<GiftCardPurchaseDialogProps> = ({
  isOpen,
  onClose,
  giftItem,
  currentUserId,
  onPurchase,
}) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const purchaseAmount = parseFloat(amount);
    
    if (!amount || isNaN(purchaseAmount) || purchaseAmount <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onPurchase(purchaseAmount);
      setAmount('');
      onClose();
    } catch (error) {
      console.error('Failed to purchase gift card:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPurchased = parseFloat(giftItem.gift_card_total_purchased?.toString() || '0') || 0;
  const targetAmount = parseFloat(giftItem.gift_card_target_amount?.toString() || '0') || null;
  const remaining = targetAmount && targetAmount > 0 ? targetAmount - totalPurchased : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Purchase Gift Card
          </DialogTitle>
          <DialogDescription>
            Add an amount for the {giftItem.name} gift card.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Current Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total purchased:</span>
              <span className="font-medium">${totalPurchased.toFixed(2)}</span>
            </div>
            {targetAmount && targetAmount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target amount:</span>
                  <span className="font-medium">${targetAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-medium text-blue-600">
                    ${remaining ? remaining.toFixed(2) : '0.00'}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((totalPurchased / targetAmount) * 100, 100)}%`,
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Amount Input */}
          <div className="grid gap-2">
            <Label htmlFor="amount">Purchase Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                disabled={isSubmitting}
              />
            </div>
            {remaining && parseFloat(amount) > remaining && (
              <p className="text-sm text-orange-600">
                Amount exceeds remaining target by ${(parseFloat(amount) - remaining).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <DollarSign className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Processing...' : `Purchase $${amount || '0.00'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GiftCardPurchaseDialog;
