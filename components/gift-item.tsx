import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ShoppingCart, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import PriceTag from './price-tag';

export type GiftItemProps = {
  item: {
    id: string;
    name: string;
    description?: string;
    price?: string;
    link?: string;
    purchased_by?: string | null;
    owner_id: string;
  };
  currentUserId: string;
  purchaserName?: string;
  variant?: 'my-gifts' | 'family-gifts';
  onEdit?: (item: any) => void;
  onDelete?: (itemId: string) => void;
  onTogglePurchase?: (itemId: string, currentPurchasedBy: string | null) => void;
};

const GiftItem: React.FC<GiftItemProps> = ({
  item,
  currentUserId,
  purchaserName,
  variant = 'my-gifts',
  onEdit,
  onDelete,
  onTogglePurchase
}) => {
  const isMyGift = variant === 'my-gifts';
  const isPurchased = !!item.purchased_by;

  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
        isPurchased && !isMyGift
          ? "bg-green-50 border-green-200"
          : "bg-white hover:bg-gray-50"
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3
            className={`font-medium ${
              isPurchased && !isMyGift ? "line-through text-muted-foreground" : ""
            }`}
          >
            {item.name}
          </h3>
          {item.price && (
            <PriceTag price={item.price} />
          )}
          {isPurchased && !isMyGift && purchaserName && (
            <Badge className="bg-green-100 text-green-800">
              Purchased by {purchaserName}
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground mb-2">
            {item.description}
          </p>
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
  );
};

export default GiftItem;
