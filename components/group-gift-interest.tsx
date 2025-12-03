import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { useTranslation, formatMessage } from './i18n-provider';

interface GiftInterest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  created_at: string;
}

interface GroupGiftInterestProps {
  giftItemId: string;
  currentUserId: string;
  isOwner: boolean;
  isPublic?: boolean;
  onInterestChange?: () => void;
}

const GroupGiftInterest: React.FC<GroupGiftInterestProps> = ({
  giftItemId,
  currentUserId,
  isOwner,
  isPublic = true,
  onInterestChange
}) => {
  const { t } = useTranslation('gifts');
  const [interests, setInterests] = useState<GiftInterest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const fetchInterests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/gift-interest?gift_item_id=${giftItemId}`);
      if (response.ok) {
        const data = await response.json();
        setInterests(data.interests || []);
      }
    } catch (error) {
      console.error('Failed to fetch gift interest:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterests();
  }, [giftItemId]);

  const isUserInterested = interests.some(interest => interest.user_id === currentUserId);

  const handleToggleInterest = async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (isUserInterested) {
        // Remove interest
        const response = await fetch(
          `/api/gift-interest?gift_item_id=${giftItemId}&user_id=${currentUserId}`,
          { method: 'DELETE' }
        );
        if (response.ok) {
          setInterests(prev => prev.filter(interest => interest.user_id !== currentUserId));
          onInterestChange?.();
        }
      } else {
        // Add interest
        const response = await fetch('/api/gift-interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gift_item_id: giftItemId, user_id: currentUserId })
        });
        if (response.ok) {
          const data = await response.json();
          setInterests(prev => [...prev, data.interest]);
          onInterestChange?.();
        }
      }
    } catch (error) {
      console.error('Failed to toggle gift interest:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter out owner from the visible interests
  // If owner and list is private (surprise mode), hide all interests
  const visibleInterests = isOwner && !isPublic
    ? []
    : isOwner
    ? interests.filter(interest => interest.user_id !== currentUserId)
    : interests;

  return (
    <div className="space-y-2 mt-3">
      {/* Show interest button for non-owners */}
      {!isOwner && (
        <Button
          variant={isUserInterested ? "default" : "secondary"}
          size="sm"
          onClick={handleToggleInterest}
          disabled={loading}
          className={isUserInterested ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          {isUserInterested ? (
            <>
              <UserMinus className="size-3" />
              {t.groupGift?.alreadyInterested || 'Interested'}
            </>
          ) : (
            <>
              <UserPlus className="size-3" />
              {t.groupGift?.expressInterest || 'Interested in Group Gift?'}
            </>
          )}
        </Button>
      )}

      {/* Show interested users count */}
      {visibleInterests.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="flex items-center gap-1 cursor-pointer hover:bg-gray-100"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Users className="w-3 h-3" />
            {formatMessage(
              visibleInterests.length === 1 
                ? (t.groupGift?.interested || '{{count}} person interested')
                : (t.groupGift?.interestedPlural || '{{count}} people interested'),
              { count: visibleInterests.length }
            )}
          </Badge>
        </div>
      )}

      {/* Detailed list of interested users */}
      {showDetails && visibleInterests.length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
          <div className="flex items-center gap-1 font-medium text-gray-700 mb-2">
            <Users className="w-3 h-3" />
            {t.groupGift?.interestedIn || 'Interested in group gift:'}
          </div>
          {visibleInterests.map((interest) => (
            <div key={interest.id} className="flex justify-between items-center">
              <span className="text-gray-600">{interest.user_name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Message for owner if they are interested (hidden from count) */}
      {isOwner && interests.some(interest => interest.user_id === currentUserId) && (
        <Badge variant="outline" className="text-xs text-gray-500">
          {t.groupGift?.hiddenFromOthers || 'Your interest is hidden from others'}
        </Badge>
      )}
    </div>
  );
};

export default GroupGiftInterest;
