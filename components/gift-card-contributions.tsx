import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Edit, Trash2, Check, X } from 'lucide-react';
import { formatCurrency, getUserLocale, getUserCurrency } from '@/lib/currency';
import { useTranslation, formatMessage } from './i18n-provider';

interface GiftCardPurchase {
  id: string;
  purchaser_id: string;
  purchaser_name: string;
  amount: string;
  created_at: string;
}

interface GiftCardContributionsProps {
  giftItemId: string;
  currentUserId: string;
  isOwner: boolean;
  onPurchaseUpdate?: () => void;
}

const GiftCardContributions: React.FC<GiftCardContributionsProps> = ({
  giftItemId,
  currentUserId,
  isOwner,
  onPurchaseUpdate
}) => {
  const { t } = useTranslation('gifts');
  const [purchases, setPurchases] = useState<GiftCardPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const locale = getUserLocale();
  const currency = getUserCurrency(locale);

  const fetchPurchases = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/gift-card-purchases?gift_item_id=${giftItemId}`);
      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases || []);
      }
    } catch (error) {
      console.error('Failed to fetch gift card purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [giftItemId]);

  const handleEditStart = (purchase: GiftCardPurchase) => {
    setEditingId(purchase.id);
    setEditAmount(purchase.amount);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditAmount('');
  };

  const handleEditSave = async (purchaseId: string) => {
    if (!editAmount || parseFloat(editAmount) <= 0) {
      return;
    }

    try {
      const response = await fetch(`/api/gift-card-purchases?id=${purchaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(editAmount) }),
      });

      if (response.ok) {
        await fetchPurchases();
        onPurchaseUpdate?.();
        setEditingId(null);
        setEditAmount('');
      } else {
        console.error('Failed to update purchase');
      }
    } catch (error) {
      console.error('Failed to update purchase:', error);
    }
  };

  const handleDelete = async (purchaseId: string) => {
    if (!confirm(t.giftCard?.deleteConfirm || 'Are you sure you want to delete this contribution?')) {
      return;
    }

    try {
      const response = await fetch(`/api/gift-card-purchases?id=${purchaseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPurchases();
        onPurchaseUpdate?.();
      } else {
        console.error('Failed to delete purchase');
      }
    } catch (error) {
      console.error('Failed to delete purchase:', error);
    }
  };

  // Filter purchases to show appropriate ones based on context
  // Users should always see their own contributions so they can edit them
  // Gift owners see all contributions for management purposes
  const visiblePurchases = isOwner
    ? purchases // Owners can see all contributions
    : purchases.filter(purchase => purchase.purchaser_id === currentUserId); // Non-owners only see their own contributions

  if (purchases.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-1">
      {visiblePurchases.map((purchase) => {
        const isCurrentUser = purchase.purchaser_id === currentUserId;
        const canEdit = isCurrentUser; // Users can only edit their own contributions
        const isEditing = editingId === purchase.id;

        return (
          <div
            key={purchase.id}
            className="flex flex-col gap-3 md:flex-row items-center justify-between text-xs text-gray-600 bg-white/90 p-2 rounded-lg"
          >
            <div className="flex items-center gap-2  justify-between w-full md:w-auto">
              <span>
                {formatMessage(t.giftCard?.addedBy || '{{name}} added:', { name: purchase.purchaser_name })}
              </span>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <span>$</span>
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-20 h-6 text-xs"
                    min="0"
                    step="0.01"
                    autoFocus
                  />
                </div>
              ) : (
                <Badge variant="outline" className="text-xs">
                  {formatCurrency(parseFloat(purchase.amount), currency, locale)}
                </Badge>
              )}
            </div>

            {canEdit && (
              <div className="flex items-center gap-1">
                {isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-green-600 hover:text-green-700"
                      onClick={() => handleEditSave(purchase.id)}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-gray-600 hover:text-gray-700"
                      onClick={handleEditCancel}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-blue-600 hover:text-blue-700"
                      onClick={() => handleEditStart(purchase)}
                      title={t.giftCard?.editTooltip || "Edit your contribution"}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(purchase.id)}
                      title={t.giftCard?.deleteTooltip || "Delete your contribution"}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GiftCardContributions;
