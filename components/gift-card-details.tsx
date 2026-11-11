import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Eye, EyeOff, Gift, Users } from 'lucide-react';
import { formatCurrency, getUserLocale, getUserCurrency } from '@/lib/currency';
import { useTranslation } from './i18n-provider';

interface GiftCardPurchase {
  id: string;
  purchaser_id: string;
  purchaser_name: string;
  amount: string;
  created_at: string;
}

interface GiftCardDetailsProps {
  giftItemId: string;
  currentUserId: string;
  isOwner: boolean;
  /** false = "Keep Surprise" list: the owner must not see totals or contributors */
  isPublic?: boolean;
  totalPurchased: number;
  targetAmount?: number | null;
}

const GiftCardDetails: React.FC<GiftCardDetailsProps> = ({
  giftItemId,
  currentUserId,
  isOwner,
  isPublic = false,
  totalPurchased,
  targetAmount
}) => {
  const { t } = useTranslation('gifts');
  const tCard = t.giftCard || {};
  const [purchases, setPurchases] = useState<GiftCardPurchase[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const locale = getUserLocale();
  const currency = getUserCurrency(locale);

  // Default to surprise when visibility is unknown: hiding too much is recoverable, leaking is not
  const isSurpriseOwner = isOwner && !isPublic;

  const fetchPurchases = useCallback(async () => {
    try {
      const response = await fetch(`/api/gift-card-purchases?gift_item_id=${giftItemId}`);
      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases || []);
      }
    } catch (error) {
      console.error('Failed to fetch gift card purchases:', error);
    }
  }, [giftItemId]);

  useEffect(() => {
    if (isOwner && !isSurpriseOwner) fetchPurchases();
  }, [isOwner, isSurpriseOwner, fetchPurchases]);

  if (isSurpriseOwner) {
    return (
      <Badge variant="secondary" className="flex items-center gap-2">
        <Gift className="size-3" aria-hidden="true" />
        {tCard.surpriseOwner || 'Contributions are kept a surprise'}
      </Badge>
    );
  }

  if (!isOwner) {
    return (
      <Badge variant="secondary">
        {formatCurrency(totalPurchased, currency, locale)}
      </Badge>
    );
  }

  // Owner of a "Track Purchases" list
  const visiblePurchases = purchases.filter(p => p.purchaser_id !== currentUserId);
  const visibleTotal = visiblePurchases.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const ownTotal = purchases
    .filter(p => p.purchaser_id === currentUserId)
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const groupedPurchases = visiblePurchases.reduce((groups, purchase) => {
    const key = purchase.purchaser_name;
    if (!groups[key]) groups[key] = { name: key, total: 0 };
    groups[key].total += parseFloat(purchase.amount);
    return groups;
  }, {} as Record<string, { name: string; total: number }>);

  const toggleLabel = showDetails
    ? (tCard.hideContributors || 'Hide contributors')
    : (tCard.showContributors || 'Show contributors');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Badge variant="secondary">
          {targetAmount && targetAmount > 0
            ? `${formatCurrency(visibleTotal, currency, locale)} / ${formatCurrency(targetAmount, currency, locale)}`
            : formatCurrency(visibleTotal, currency, locale)}
        </Badge>
        {visiblePurchases.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setShowDetails(!showDetails)}
            aria-label={toggleLabel}
            aria-expanded={showDetails}
            title={toggleLabel}
          >
            {showDetails ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        )}
      </div>

      {ownTotal > 0 && (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          {tCard.yourContributionHidden || 'Your contribution is hidden'}
        </Badge>
      )}

      {showDetails && (
        <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
          <div className="flex items-center gap-1 font-medium text-foreground mb-2">
            <Users className="size-3" aria-hidden="true" />
            {tCard.contributorsLabel || 'Contributors'}
          </div>
          {Object.values(groupedPurchases).map((group) => (
            <div key={group.name} className="flex justify-between items-center">
              <span className="text-muted-foreground">{group.name}</span>
              <Badge variant="outline" className="text-xs">
                {formatCurrency(group.total, currency, locale)}
              </Badge>
            </div>
          ))}
          {visiblePurchases.length === 0 && (
            <div className="text-muted-foreground italic">{tCard.noneVisible || 'No contributions visible'}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GiftCardDetails;
