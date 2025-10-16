import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ShoppingCart, ExternalLink, CreditCard, Archive } from 'lucide-react';
import Link from 'next/link';
import PriceTag from './price-tag';
import GiftCardPurchaseDialog from './gift-card-purchase-dialog';
import GiftCardDetails from './gift-card-details';
import GiftCardContributions from './gift-card-contributions';
import { cn } from '@/lib/utils';

export type GiftItemProps = {
  item: {
    id: string;
    name: string;
    description?: string;
    price?: string;
    link?: string;
    purchased_by?: string | null;
    owner_id: string;
    list_id?: string;
    is_public?: boolean;
    is_gift_card?: boolean;
    gift_card_target_amount?: number | string | null;
    gift_card_total_purchased?: number | string;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: string | null;
    og_site_name?: string | null;
    archived?: boolean;
    image_url?: string | null;
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
        className={`flex items-center flex-col md:flex-row justify-between transition-colors relative py-4 md:py-2 ${
          isArchived
            ? "bg-gray-100 border-gray-300 opacity-75"
            // : (isPurchased && (!isMyGift || (isMyGift && item.is_public))) || (isGiftCard && isGiftCardComplete && (!isMyGift || (isMyGift && item.is_public)))
            // ? "bg-green-50 border-green-200"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-start md:items-center gap-1 md:absolute w-full md:w-auto md:right-4 md:top-4 mb-2">
            {isArchived && (
              <Badge variant="outline" className="text-gray-600 border-gray-400">
                <Archive className="w-3 h-3 mr-1" />
                Archived
              </Badge>
            )}
            {isGiftCard && (
              <Badge variant="giftcard" className="">
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
              className={`font-medium truncate md:text-lg md:pr-20 ${
                isArchived ? "line-through text-gray-500" :
                ((isPurchased && (!isMyGift || (isMyGift && item.is_public))) || (isGiftCard && isGiftCardComplete && (!isMyGift || (isMyGift && item.is_public)))) ? "line-through text-muted-foreground" : ""
              }`}
            >
              {item.name}
            </h3>
          <div className="flex gap-3 flex-row">  {item.image_url && !item.og_image && (
              <div className="flex-shrink-0">
                <div
                              className="size-16 md:size-16 object-cover rounded overflow-hidden bg-gray-100 flex items-center justify-center"
>
                <img
              src={item.image_url}
              alt={item.og_title || item.name}
              className="size-16 md:size-16 object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            </div>
              </div>)}
          {item.description && (
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground mb-2 md:mb-4 mt-1">
                {item.description}
              </p>
            </div>
          )}
          </div>
          </div>

          {/* OpenGraph Data Display */}
          {(item.og_title || item.og_description || item.og_image) && (
            <div className="">
              {item.link && (
                <Link
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                <div className="flex gap-3 flex-row">
                  {item.og_image && (
                    <div className="flex-shrink-0">
                      <img
                        src={item.og_image}
                        alt={item.og_title || item.name}
                        className="size-16 md:size-16 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {item.og_title && (
                      <h4 className="text-sm font-medium text-gray-900 truncate sr-only">
                        {item.og_title}
                      </h4>
                    )}
                    {item.og_description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                        {item.og_description}
                      </p>
                    )}
                    {item.og_site_name && (
                      <p className="text-xs text-foreground mt-1 font-medium">
                        {item.og_site_name} <ExternalLink className="inline size-3 -mt-1" />
                      </p>
                    )}
                  </div>
                </div>
              </Link>)}
            </div>
          )}

          <div className='flex md:items-center gap-2 flex-row mt-6'>
            {item.link && (
              <Link
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className='w-1/2 md:w-auto'
                passHref
              >
                <Button variant="default" size="sm" className="w-full md:w-auto">
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
                    className={cn(isGiftCardComplete ? "bg-green-600 hover:bg-green-700" : "", 'w-1/2 md:w-auto')}
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
                    className={cn(isPurchased ? "bg-green-600 hover:bg-green-700" : "", 'w-1/2 md:w-auto')}
                  >
                    <ShoppingCart className="size-3" />
                    {isPurchased ? "Purchased" : "Purchase"}
                  </Button>
                )}
              </>
            )}
            {isMyGift && (
          // My Gifts - Edit/Delete/Archive buttons
              <div className="flex md:flex-row gap-2 ml-auto">
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

          {/* Show purchase status for owners if list is public */}
          {isMyGift && item.is_public && ((isPurchased && !isGiftCard) || (isGiftCard && isGiftCardComplete)) && purchaserName && (
            <Badge className="bg-green-100 text-green-800 mt-4">
              {isGiftCard ? 'Gift card complete' : `Purchased by ${purchaserName}`}
            </Badge>
          )}

          {/* Gift Card Contributions */}
            {isGiftCard && !isMyGift && (
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
