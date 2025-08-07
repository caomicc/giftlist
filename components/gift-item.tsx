import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ShoppingCart, ExternalLink, CreditCard, Info } from 'lucide-react';
import Link from 'next/link';
import PriceTag from './price-tag';
import GiftCardPurchaseDialog from './gift-card-purchase-dialog';

export type GiftItemProps = {
  item: {
    id: string;
    name: string;
    description?: string;
    price?: string;
    link?: string;
    purchased_by?: string | null;
    owner_id: string;
    is_gift_card?: boolean;
    gift_card_target_amount?: number | string | null;
    gift_card_total_purchased?: number | string;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: string | null;
    og_site_name?: string | null;
  };
  currentUserId: string;
  purchaserName?: string;
  variant?: 'my-gifts' | 'family-gifts';
  onEdit?: (item: any) => void;
  onDelete?: (itemId: string) => void;
  onTogglePurchase?: (itemId: string, currentPurchasedBy: string | null) => void;
  onGiftCardPurchase?: (itemId: string, amount: number) => Promise<void>;
};

const GiftItem: React.FC<GiftItemProps> = ({
  item,
  currentUserId,
  purchaserName,
  variant = 'my-gifts',
  onEdit,
  onDelete,
  onTogglePurchase,
  onGiftCardPurchase
}) => {
  const [isGiftCardDialogOpen, setIsGiftCardDialogOpen] = useState(false);

  const isMyGift = variant === 'my-gifts';
  const isPurchased = !!item.purchased_by;
  const isGiftCard = item.is_gift_card;
  const giftCardTotal = parseFloat(item.gift_card_total_purchased?.toString() || '0') || 0;
  const giftCardTarget = parseFloat(item.gift_card_target_amount?.toString() || '0') || null;
  const isGiftCardComplete = giftCardTarget ? giftCardTotal >= giftCardTarget : false;

  const handleGiftCardPurchase = async (amount: number) => {
    if (onGiftCardPurchase) {
      await onGiftCardPurchase(item.id, amount);
    }
  };

  return (
    <>
      <div
        className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
          (isPurchased && !isMyGift) || (isGiftCard && isGiftCardComplete && !isMyGift)
            ? "bg-green-50 border-green-200"
            : "bg-white hover:bg-gray-50"
        }`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-medium ${
                ((isPurchased && !isMyGift) || (isGiftCard && isGiftCardComplete && !isMyGift)) ? "line-through text-muted-foreground" : ""
              }`}
            >
              {item.name}
            </h3>
            {isGiftCard && (
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                <CreditCard className="w-3 h-3 mr-1" />
                Gift Card
              </Badge>
            )}
            {item.price && !isGiftCard && (
              <PriceTag price={item.price} />
            )}
            {isGiftCard && (
              <Badge variant="secondary">
                ${giftCardTotal.toFixed(2)}
                {giftCardTarget && giftCardTarget > 0 && ` / $${giftCardTarget.toFixed(2)}`}
              </Badge>
            )}
            {((isPurchased && !isGiftCard) || (isGiftCard && isGiftCardComplete)) && !isMyGift && purchaserName && (
              <Badge className="bg-green-100 text-green-800">
                {isGiftCard ? 'Complete' : `Purchased by ${purchaserName}`}
              </Badge>
            )}
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {item.description}
            </p>
          )}

          {/* OpenGraph Data Display */}
          {(item.og_title || item.og_description || item.og_image) && (
            <div className="border rounded-lg p-3 mb-2 bg-gray-50">
              <div className="flex gap-3">
                {item.og_image && (
                  <div className="flex-shrink-0">
                    <img
                      src={item.og_image}
                      alt={item.og_title || item.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {item.og_title && (
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {item.og_title}
                    </h4>
                  )}
                  {item.og_description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                      {item.og_description}
                    </p>
                  )}
                  {item.og_site_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      {item.og_site_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className='flex items-center gap-2'>
            {item.link && (
              <Link
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                passHref
              >
                <Button variant="default" size="sm">
                  View Link <ExternalLink className="size-3" />
                </Button>
              </Link>
            )}
            {!isMyGift && (
              <>
                {isGiftCard ? (
                  <Button
                    variant={isGiftCardComplete ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setIsGiftCardDialogOpen(true)}
                    className={isGiftCardComplete ? "bg-green-600 hover:bg-green-700" : ""}
                    disabled={isGiftCardComplete}
                  >
                    <CreditCard className="size-3" />
                    {isGiftCardComplete ? "Complete" : "Add Amount"}
                  </Button>
                ) : (
                  <Button
                    variant={isPurchased ? "default" : "secondary"}
                    size="sm"
                    onClick={() => onTogglePurchase?.(item.id, item.purchased_by || null)}
                    className={isPurchased ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <ShoppingCart className="size-3" />
                    {isPurchased ? "Purchased" : "Mark as Purchased"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isMyGift && (
          // My Gifts - Edit/Delete buttons
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(item)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(item.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Gift Card Purchase Dialog */}
      {isGiftCard && (
        <GiftCardPurchaseDialog
          isOpen={isGiftCardDialogOpen}
          onClose={() => setIsGiftCardDialogOpen(false)}
          giftItem={item}
          currentUserId={currentUserId}
          onPurchase={handleGiftCardPurchase}
        />
      )}
    </>
  );
};

export default GiftItem;
