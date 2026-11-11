'use client'

import React from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation, formatMessage } from './i18n-provider'

type ClaimButtonProps = {
  itemId: string
  purchasedBy: string | null | undefined
  currentUserId: string
  purchaserName?: string
  onToggle?: (itemId: string, currentPurchasedBy: string | null) => void
  className?: string
}

/**
 * The buyer's main action on someone else's gift. Three states:
 * - open: "I'll get this" (claims it for the current user)
 * - mine: "You're getting this" (pressing again releases the claim)
 * - someone else's: a static "Claimed by {name}" label; only that person can release it
 */
export function ClaimButton({
  itemId,
  purchasedBy,
  currentUserId,
  purchaserName,
  onToggle,
  className,
}: ClaimButtonProps) {
  const { t } = useTranslation('gifts')
  const labels = t.giftItem?.claim || {}

  const isMine = purchasedBy === currentUserId
  const isOthers = !!purchasedBy && !isMine

  if (isOthers) {
    return (
      <span
        className={cn(
          'inline-flex h-8 items-center gap-1 rounded-md bg-muted px-2.5 text-xs font-medium text-muted-foreground',
          className
        )}
      >
        <Check className="size-3.5" aria-hidden="true" />
        {purchaserName
          ? formatMessage(labels.claimedBy || 'Claimed by {{name}}', { name: purchaserName })
          : (labels.claimed || 'Claimed')}
      </span>
    )
  }

  return (
    <Button
      variant={isMine ? 'default' : 'secondary'}
      size="sm"
      aria-pressed={isMine}
      title={isMine ? (labels.releaseHint || 'Tap to unmark') : undefined}
      onClick={(e) => {
        e.stopPropagation()
        onToggle?.(itemId, purchasedBy || null)
      }}
      className={cn(isMine && 'bg-success text-success-foreground hover:bg-success/90', className)}
    >
      {isMine ? <Check className="size-3.5" aria-hidden="true" /> : <ShoppingCart className="size-3.5" aria-hidden="true" />}
      {isMine ? (labels.mine || "You're getting this") : (labels.claim || "I'll get this")}
    </Button>
  )
}
