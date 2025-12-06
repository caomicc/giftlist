"use client"

import React, { useState, useEffect } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ExternalLink,
  CreditCard,
  Archive,
  Users,
  Edit,
  Trash2,
  ShoppingCart,
  MessageCircle,
  Send,
  X,
} from 'lucide-react'
import Link from 'next/link'
import PriceTag from './price-tag'
import GiftCardDetails from './gift-card-details'
import GiftCardContributions from './gift-card-contributions'
import GroupGiftInterest from './group-gift-interest'
import GiftCardPurchaseDialog from './gift-card-purchase-dialog'
import { useGiftItemComments } from '@/hooks/useGiftItemComments'
import { useTranslation, formatMessage } from './i18n-provider'
import { cn, formatRelativeTime } from '@/lib/utils'

export type GiftItemDrawerProps = {
  item: {
    id: string
    name: string
    description?: string
    price?: string
    link?: string
    purchased_by?: string | null
    owner_id: string
    list_id?: string
    is_public?: boolean
    is_gift_card?: boolean
    is_group_gift?: boolean
    gift_card_target_amount?: number | string | null
    gift_card_total_purchased?: number | string
    og_title?: string | null
    og_description?: string | null
    og_image?: string | null
    og_site_name?: string | null
    archived?: boolean
    image_url?: string | null
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: string
  purchaserName?: string
  variant?: 'my-gifts' | 'family-gifts'
  onEdit?: (item: any) => void
  onDelete?: (itemId: string) => void
  onArchive?: (itemId: string) => void
  onTogglePurchase?: (itemId: string, currentPurchasedBy: string | null) => void
  onGiftCardPurchase?: (itemId: string, amount: number) => Promise<void>
}

const GiftItemDrawer: React.FC<GiftItemDrawerProps> = ({
  item,
  open,
  onOpenChange,
  currentUserId,
  purchaserName,
  variant = 'my-gifts',
  onEdit,
  onDelete,
  onArchive,
  onTogglePurchase,
  onGiftCardPurchase,
}) => {
  const { t } = useTranslation('gifts')
  const { t: tCommon } = useTranslation('common')
  const [isGiftCardDialogOpen, setIsGiftCardDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    comments,
    loading: commentsLoading,
    fetchComments,
    addComment,
    deleteComment,
  } = useGiftItemComments(open && item ? item.id : null)

  // Fetch comments when drawer opens
  useEffect(() => {
    if (open && item) {
      fetchComments()
    }
  }, [open, item?.id, fetchComments])

  if (!item) return null

  const isMyGift = variant === 'my-gifts'
  const isPurchased = !!item.purchased_by
  const isGiftCard = item.is_gift_card
  const isGroupGift = item.is_group_gift
  const isArchived = item.archived
  const giftCardTotal = parseFloat(item.gift_card_total_purchased?.toString() || '0') || 0
  const giftCardTarget = parseFloat(item.gift_card_target_amount?.toString() || '0') || null
  const isGiftCardComplete = giftCardTarget ? giftCardTotal >= giftCardTarget : false

  const handleGiftCardPurchase = async (amount: number) => {
    if (onGiftCardPurchase) {
      await onGiftCardPurchase(item.id, amount)
    }
  }

  const handlePurchaseUpdate = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await addComment(newComment)
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId)
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const timeAgoTranslations = {
    justNow: tCommon.timeAgo?.justNow,
    minutesAgo: tCommon.timeAgo?.minutesAgo,
    hoursAgo: tCommon.timeAgo?.hoursAgo,
    daysAgo: tCommon.timeAgo?.daysAgo,
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="sm:max-w-lg overflow-y-scroll overflow-x-hidden flex flex-col h-full">
          <DrawerHeader className="border-b">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <DrawerTitle
                  className={cn(
                    'text-lg',
                    isArchived && 'line-through text-gray-500',
                    ((isPurchased && (!isMyGift || (isMyGift && item.is_public))) ||
                      (isGiftCard && isGiftCardComplete && (!isMyGift || (isMyGift && item.is_public)))) &&
                      'line-through text-muted-foreground'
                  )}
                >
                  {item.name}
                </DrawerTitle>
                <div className="flex flex-wrap gap-1 mt-2">
                  {isArchived && (
                    <Badge variant="outline" className="text-gray-600 border-gray-400">
                      <Archive className="w-3 h-3 mr-1" />
                      {t.giftItem?.badges?.archived || 'Archived'}
                    </Badge>
                  )}
                  {isGroupGift && (
                    <Badge variant="outline" className="text-purple-600 border-purple-400">
                      <Users className="w-3 h-3 mr-1" />
                      {t.giftItem?.badges?.groupGift || 'Group Gift'}
                    </Badge>
                  )}
                  {isGiftCard && (
                    <Badge variant="secondary">
                      <CreditCard className="w-3 h-3 mr-1" />
                      {t.giftItem?.badges?.giftCard || 'Gift Card'}
                    </Badge>
                  )}
                  {item.price && !isGiftCard && <PriceTag price={item.price} />}
                </div>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <ScrollArea className="flex-1 px-4">
            <div className="py-4 space-y-6">
              {/* Image and OG Preview */}
              {(item.og_image || item.image_url) && (
                <div className="relative">
                  <img
                    src={item.og_image || item.image_url || ''}
                    alt={item.og_title || item.name}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}

              {/* Description */}
              {item.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    {t.drawer?.description || 'Description'}
                  </h4>
                  <p className="text-sm text-foreground">{item.description}</p>
                </div>
              )}

              {/* OG Metadata */}
              {item.og_description && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground line-clamp-3">{item.og_description}</p>
                  {item.og_site_name && item.link && (
                    <Link href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-foreground mt-2 font-medium flex items-center gap-1">
                      {item.og_site_name}
                      <ExternalLink className="size-3" />
                    </Link>
                  )}
                </div>
              )}

              {/* Gift Card Details */}
              {isGiftCard && (
                <div>
                  <GiftCardDetails
                    key={refreshKey}
                    giftItemId={item.id}
                    currentUserId={currentUserId}
                    isOwner={isMyGift}
                    totalPurchased={giftCardTotal}
                    targetAmount={giftCardTarget}
                  />
                  {!isMyGift && (
                    <GiftCardContributions
                      key={`contributions-${refreshKey}`}
                      giftItemId={item.id}
                      currentUserId={currentUserId}
                      isOwner={isMyGift}
                      onPurchaseUpdate={handlePurchaseUpdate}
                    />
                  )}
                </div>
              )}

              {/* Group Gift Interest */}
              {isGroupGift && (
                <GroupGiftInterest
                  giftItemId={item.id}
                  currentUserId={currentUserId}
                  isOwner={isMyGift}
                  isPublic={item.is_public}
                  onInterestChange={handlePurchaseUpdate}
                />
              )}

              {/* Purchase Status */}
              {((isPurchased && !isGiftCard) || (isGiftCard && isGiftCardComplete)) &&
                !isMyGift &&
                purchaserName && (
                  <Badge className="bg-green-100 text-green-800">
                    {formatMessage(
                      isGiftCard
                        ? t.giftItem?.status?.giftCardComplete ?? 'Gift Card Complete'
                        : t.giftItem?.status?.purchasedBy ?? `Purchased by ${purchaserName}`,
                      { name: purchaserName }
                    )}
                  </Badge>
                )}

              {isMyGift &&
                item.is_public &&
                ((isPurchased && !isGiftCard) || (isGiftCard && isGiftCardComplete)) &&
                purchaserName && (
                  <Badge className="bg-green-100 text-green-800">
                    {formatMessage(
                      isGiftCard
                        ? t.giftItem?.status?.giftCardComplete ?? 'Gift Card Complete'
                        : t.giftItem?.status?.purchasedBy ?? `Purchased by ${purchaserName}`,
                      { name: purchaserName }
                    )}
                  </Badge>
                )}

              <Separator />

              {/* Comments Section */}
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4" />
                  {t.drawer?.commentsTitle || 'Comments'}
                  {comments.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {comments.length}
                    </Badge>
                  )}
                </h4>

                {commentsLoading ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    {tCommon.loading || 'Loading...'}
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    {t.drawer?.noComments || 'No comments yet. Start the conversation!'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2 group">
                        <Avatar className="size-7 shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {comment.user_name
                              ?.split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{comment.user_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(comment.created_at, timeAgoTranslations)}
                            </span>
                            {comment.user_id === currentUserId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                onClick={() => handleDeleteComment(comment.id)}
                                title={t.drawer?.deleteComment || 'Delete comment'}
                              >
                                <Trash2 className="size-3 text-red-500" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input */}
                <div className="flex gap-2 mt-4">
                  <Textarea
                    placeholder={t.drawer?.addCommentPlaceholder || 'Add a comment...'}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] resize-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleSubmitComment()
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className="shrink-0 self-end"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DrawerFooter className="border-t">
            <div className="flex flex-wrap gap-2">
              {item.link && (
                <Link href={item.link} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="default" size="sm" className="w-full">
                    {t.giftItem?.buttons?.viewLink ?? 'View Link'}
                    <ExternalLink className="size-3 ml-1" />
                  </Button>
                </Link>
              )}

              {!isMyGift && (
                <>
                  {isGiftCard ? (
                    <Button
                      variant={isGiftCardComplete ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setIsGiftCardDialogOpen(true)}
                      className={cn(isGiftCardComplete && 'bg-green-600 hover:bg-green-700', 'flex-1')}
                      disabled={isGiftCardComplete}
                    >
                      <CreditCard className="size-3 mr-1" />
                      {isGiftCardComplete ? t.giftItem?.buttons?.complete : t.giftItem?.buttons?.addAmount}
                    </Button>
                  ) : (
                    <Button
                      variant={isPurchased ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => onTogglePurchase?.(item.id, item.purchased_by || null)}
                      className={cn(isPurchased && 'bg-green-600 hover:bg-green-700', 'flex-1')}
                    >
                      <ShoppingCart className="size-3 mr-1" />
                      {t.giftItem?.buttons?.[isPurchased ? 'purchased' : 'purchase']}
                    </Button>
                  )}
                </>
              )}

              {isMyGift && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onEdit?.(item)
                      onOpenChange(false)
                    }}
                    disabled={isArchived}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {t.giftItem?.buttons?.edit || 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onArchive?.(item.id)
                      onOpenChange(false)
                    }}
                    className={isArchived ? 'text-blue-600' : 'text-orange-600'}
                  >
                    <Archive className="w-4 h-4 mr-1" />
                    {isArchived
                      ? t.giftItem?.buttons?.unarchive || 'Unarchive'
                      : t.giftItem?.buttons?.archive || 'Archive'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onDelete?.(item.id)
                      onOpenChange(false)
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t.giftItem?.buttons?.delete || 'Delete'}
                  </Button>
                </>
              )}
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
  )
}

export default GiftItemDrawer
