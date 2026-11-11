'use client'

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ExternalLink, CreditCard, Archive, Users, ChevronRight, MessageCircle, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import PriceTag from './price-tag';
import GiftCardPurchaseDialog from './gift-card-purchase-dialog';
import GiftItemDrawer from './gift-item-drawer';
import { ClaimButton } from './claim-button';
import { cn } from '@/lib/utils';
import { useTranslation, formatMessage } from './i18n-provider';

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
    is_group_gift?: boolean;
    gift_card_target_amount?: number | string | null;
    gift_card_total_purchased?: number | string;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: string | null;
    og_site_name?: string | null;
    archived?: boolean;
    image_url?: string | null;
    comment_count?: number;
    suggested_by_name?: string | null;
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
  const { t } = useTranslation('gifts')
  const [isGiftCardDialogOpen, setIsGiftCardDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isMyGift = variant === 'my-gifts';
  const isPurchased = !!item.purchased_by;
  const isGiftCard = item.is_gift_card;
  const isGroupGift = item.is_group_gift;
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
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Prevent opening drawer when clicking on buttons or links
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    setIsDrawerOpen(true);
  };

  // Get preview image (OG image or custom image)
  const previewImage = item.og_image || item.image_url;

  return (
    <>
      <div
        onClick={handleRowClick}
        className={cn(
          'flex items-center gap-3 py-3 px-2 transition-colors cursor-pointer hover:bg-muted/50 group',
          isArchived && 'bg-muted opacity-75',
        )}
      >
        {/* Thumbnail */}
        {previewImage && (
          <div className="shrink-0">
            <img
              src={previewImage}
              alt=""
              className="size-12 object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'font-medium truncate text-sm md:text-base',
                isArchived && 'line-through text-muted-foreground',
                ((isPurchased && (!isMyGift || (isMyGift && item.is_public))) ||
                  (isGiftCard && isGiftCardComplete && (!isMyGift || (isMyGift && item.is_public)))) &&
                  'line-through text-muted-foreground'
              )}
            >
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="max-w-full truncate text-left rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {item.name}
              </button>
            </h3>
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {isArchived && (
              <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                <Archive className="w-3 h-3 mr-0.5" />
                {t.giftItem?.badges?.archived || 'Archived'}
              </Badge>
            )}
            {isGroupGift && (
              <Badge variant="outline" className="text-xs text-group-gift border-group-gift/40">
                <Users className="w-3 h-3 mr-0.5" />
                {t.giftItem?.badges?.groupGift || 'Group Gift'}
              </Badge>
            )}
            {isGiftCard && (
              <Badge variant="secondary" className="text-xs">
                <CreditCard className="w-3 h-3 mr-0.5" />
                {t.giftItem?.badges?.giftCard || 'Gift Card'}
              </Badge>
            )}
            {item.price && !isGiftCard && <PriceTag price={item.price} />}
            {/* Comment indicator */}
            {item.comment_count && item.comment_count > 0 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <MessageCircle className="w-3 h-3 mr-0.5" />
                {item.comment_count}
              </Badge>
            )}
            {/* Suggested by badge - visible to family members, not the owner */}
            {!isMyGift && item.suggested_by_name && (
              <Badge variant="outline" className="text-xs text-suggestion border-suggestion/40">
                <Lightbulb className="w-3 h-3 mr-0.5" />
                {formatMessage(t.giftItem?.badges?.suggestedBy || 'Suggested by {{name}}', { name: item.suggested_by_name })}
              </Badge>
            )}
            {/* Purchase status badge - only show if not owner viewing private list */}
            {((isPurchased && !isGiftCard) || (isGiftCard && isGiftCardComplete)) &&
              (!isMyGift || (isMyGift && item.is_public)) && (
              <Badge className="text-xs bg-success-soft text-success-soft-foreground">
                {isGiftCard
                  ? (t.giftItem?.buttons?.complete || 'Complete')
                  : (t.giftItem?.buttons?.purchased || 'Purchased')}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!isMyGift && (
            <>
              {isGiftCard ? (
                <Button
                  variant={isGiftCardComplete ? 'default' : 'secondary'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsGiftCardDialogOpen(true);
                  }}
                  className={cn(isGiftCardComplete && 'bg-success text-success-foreground hover:bg-success/90')}
                  disabled={isGiftCardComplete}
                >
                  <CreditCard className="size-3.5" aria-hidden="true" />
                  {isGiftCardComplete ? t.giftItem?.buttons?.complete : t.giftItem?.buttons?.addAmount}
                </Button>
              ) : (
                <ClaimButton
                  itemId={item.id}
                  purchasedBy={item.purchased_by}
                  currentUserId={currentUserId}
                  purchaserName={purchaserName}
                  onToggle={onTogglePurchase}
                />
              )}
            </>
          )}

          {/* Owner actions: inline on desktop; on phones the row opens the drawer, which has the same actions labelled */}
          {isMyGift && (
            <div className="hidden md:flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(item);
                }}
                className="size-8 text-muted-foreground hover:text-foreground"
                disabled={isArchived}
                aria-label={t.giftItem?.buttons?.edit || 'Edit'}
                title={t.giftItem?.buttons?.edit || 'Edit'}
              >
                <Edit className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive?.(item.id);
                }}
                className="size-8 text-muted-foreground hover:text-foreground"
                aria-label={isArchived ? (t.giftItem?.buttons?.unarchive || 'Unarchive item') : (t.giftItem?.buttons?.archive || 'Archive item')}
                title={isArchived ? (t.giftItem?.buttons?.unarchive || 'Unarchive item') : (t.giftItem?.buttons?.archive || 'Archive item')}
              >
                <Archive className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(item.id);
                }}
                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label={t.giftItem?.buttons?.delete || 'Delete'}
                title={t.giftItem?.buttons?.delete || 'Delete'}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}

          {/* Chevron indicator for drawer */}
          <ChevronRight className="size-4 text-muted-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity" aria-hidden="true" />
        </div>
      </div>

      {/* Gift Item Drawer */}
      <GiftItemDrawer
        item={item}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        currentUserId={currentUserId}
        purchaserName={purchaserName}
        variant={variant}
        onEdit={onEdit}
        onDelete={onDelete}
        onArchive={onArchive}
        onTogglePurchase={onTogglePurchase}
        onGiftCardPurchase={onGiftCardPurchase}
      />

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
