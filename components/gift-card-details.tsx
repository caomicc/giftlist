import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Eye, EyeOff, Users } from 'lucide-react';
import { formatCurrency, getUserLocale, getUserCurrency } from '@/lib/currency';

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
  totalPurchased: number;
  targetAmount?: number | null;
}

const GiftCardDetails: React.FC<GiftCardDetailsProps> = ({
  giftItemId,
  currentUserId,
  isOwner,
  totalPurchased,
  targetAmount
}) => {
  const [purchases, setPurchases] = useState<GiftCardPurchase[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (showDetails && purchases.length === 0) {
      fetchPurchases();
    }
  }, [showDetails]);

  // Filter out current user's own purchases if they're the owner
  const visiblePurchases = isOwner 
    ? purchases.filter(purchase => purchase.purchaser_id !== currentUserId)
    : purchases;

  // Calculate totals
  const visibleTotal = visiblePurchases.reduce((sum, purchase) => sum + parseFloat(purchase.amount), 0);
  const currentUserTotal = isOwner 
    ? purchases.filter(purchase => purchase.purchaser_id === currentUserId).reduce((sum, purchase) => sum + parseFloat(purchase.amount), 0)
    : 0;

  // Group purchases by purchaser for better display
  const groupedPurchases = visiblePurchases.reduce((groups, purchase) => {
    const key = purchase.purchaser_name;
    if (!groups[key]) {
      groups[key] = { name: key, total: 0, purchases: [] };
    }
    groups[key].total += parseFloat(purchase.amount);
    groups[key].purchases.push(purchase);
    return groups;
  }, {} as Record<string, { name: string; total: number; purchases: GiftCardPurchase[] }>);

  const displayTotal = isOwner ? visibleTotal : totalPurchased;

  return (
    <div className="space-y-2">
      {/* Main total badge */}
      <Badge variant="secondary" className="flex items-center gap-2">
        {formatCurrency(displayTotal, currency, locale)}
        {targetAmount && targetAmount > 0 && ` / ${formatCurrency(targetAmount, currency, locale)}`}
        {visiblePurchases.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1"
            onClick={() => setShowDetails(!showDetails)}
            title={showDetails ? "Hide contributors" : "Show contributors"}
          >
            {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
        )}
      </Badge>

      {/* Hidden own contribution indicator for owners */}
      {isOwner && currentUserTotal > 0 && (
        <Badge variant="outline" className="text-xs text-gray-500">
          Your contribution hidden
        </Badge>
      )}

      {/* Detailed breakdown */}
      {showDetails && visiblePurchases.length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
          <div className="flex items-center gap-1 font-medium text-gray-700 mb-2">
            <Users className="w-3 h-3" />
            Contributors:
          </div>
          {Object.values(groupedPurchases).map((group) => (
            <div key={group.name} className="flex justify-between items-center">
              <span className="text-gray-600">{group.name}</span>
              <Badge variant="outline" className="text-xs">
                {formatCurrency(group.total, currency, locale)}
              </Badge>
            </div>
          ))}
          {visiblePurchases.length === 0 && (
            <div className="text-gray-500 italic">No contributions visible</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GiftCardDetails;
