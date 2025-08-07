import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ShoppingCart, ExternalLink, CreditCard, Archive } from 'lucide-react';
import Link from 'next/link';
import PriceTag from './price-tag';
import GiftCardPurchaseDialog from './gift-card-purchase-dialog';
import GiftCardDetails from './gift-card-details';
import GiftCardContributions from './gift-card-contributions';

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
    archived?: boolean;
  };
  currentUserId: string;
  purchaserName?: string;
  variant?: 'my-gifts' | 'family-gifts';
  onEdit?: (item: any) => void;
  onDelete?: (itemId: string) => void;
  onArchive?: (itemId: string) => void;
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
  onArchive,
  onTogglePurchase,
  onGiftCardPurchase
}) => {
  const [isGiftCardDialogOpen, setIsGiftCardDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isMyGift = variant === 'my-gifts';
  const isPurchased = !!item.purchased_by;
  const isGiftCard = item.is_gift_card;
  const isArchived = item.archived;
  const giftCardTotal = parseFloat(item.gift_card_total_purchased?.toString() || '0') || 0;
  const giftCardTarget = parseFloat(item.gift_card_target_amount?.toString() || '0') || null;
  const isGiftCardComplete = giftCardTarget ? giftCardTotal >= giftCardTarget : false;

  const handleGiftCardPurchase = async (amount: number) => {
    if (onGiftCardPurchase) {
      await onGiftCardPurchase(item.id, amount);
    }
  };

  const handlePurchaseUpdate = () => {
    setRefreshKey(prev => prev + 1);
    // This will trigger a refresh of parent component data
    // You might want to call a parent callback here if needed
  };

  return (
    <>
      <div
        className={`flex items-center justify-between p-4 border rounded-lg transition-colors relative ${
          isArchived
            ? "bg-gray-100 border-gray-300 opacity-75"
            : (isPurchased && !isMyGift) || (isGiftCard && isGiftCardComplete && !isMyGift)
            ? "bg-green-50 border-green-200"
            : "bg-indigo-50"
        }`}
      >
        <div className="flex items-center gap-1 absolute right-4 top-4">
            {isArchived && (
              <Badge variant="outline" className="text-gray-600 border-gray-400">
                <Archive className="w-3 h-3 mr-1" />
                Archived
              </Badge>
            )}
            {isGiftCard && (
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                <CreditCard className="w-3 h-3 mr-1" />
                Gift Card
              </Badge>
            )}
            {item.price !== undefined && !isGiftCard && (
              <PriceTag price={item.price} />
            )}
            {isGiftCard && (
              <GiftCardDetails
                key={refreshKey}
                giftItemId={item.id}
                currentUserId={currentUserId}
                isOwner={isMyGift}
                totalPurchased={giftCardTotal}
                targetAmount={giftCardTarget}
              />
            )}
        </div>
        <div className="flex-1 w-full">
          <div className="flex flex-col gap-1 mb-1">
            <h3
              className={`font-medium truncate text-lg pr-20 ${
                isArchived ? "line-through text-gray-500" :
                ((isPurchased && !isMyGift) || (isGiftCard && isGiftCardComplete && !isMyGift)) ? "line-through text-muted-foreground" : ""
              }`}
            >
              {item.name}
            </h3>
          {item.description && (
            <p className="text-sm text-foreground mb-4">
              {item.description}
            </p>
          )}

          </div>

          {/* OpenGraph Data Display */}
          {(item.og_title || item.og_description || item.og_image) && (
            <div className="mb-6">
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
                    <h4 className="text-sm font-medium text-gray-900 truncate tracking-wider">
                      {item.og_title}
                    </h4>
                  )}
                  {item.og_description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                      {item.og_description}
                    </p>
                  )}
                  {item.og_site_name && (
                    <p className="text-xs text-foreground mt-1 font-medium tracking-wider">
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
            {isMyGift && (
          // My Gifts - Edit/Delete/Archive buttons
          <div className="flex gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(item)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              disabled={isArchived}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArchive?.(item.id)}
              className={isArchived ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"}
              title={isArchived ? "Unarchive item" : "Archive item"}
            >
              <Archive className="w-4 h-4" />
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
               {((isPurchased && !isGiftCard) || (isGiftCard && isGiftCardComplete)) && !isMyGift && purchaserName && (
                <Badge className="bg-green-100 text-green-800 mt-4">
                  {isGiftCard ? 'Complete' : `Purchased by ${purchaserName}`}
                </Badge>
              )}

          {/* Gift Card Contributions */}
          {isGiftCard && (
            <GiftCardContributions
              key={`contributions-${refreshKey}`}
              giftItemId={item.id}
              currentUserId={currentUserId}
              isOwner={isMyGift}
              onPurchaseUpdate={handlePurchaseUpdate}
            />
          )}
        </div>

        {/* Action Buttons */}

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
