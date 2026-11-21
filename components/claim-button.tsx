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
    const label = purchaserName
      ? formatMessage(labels.claimedBy || 'Claimed by {{name}}', { name: purchaserName })
      : (labels.claimed || 'Claimed')
    return (
      <span
        title={label}
        className={cn(
          'inline-flex h-8 min-w-0 items-center gap-1 rounded-md bg-muted px-2.5 text-xs font-medium text-muted-foreground max-md:max-w-36',
          className
        )}
      >
        <Check className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
    )
  }

  return (
    <Button
      variant={isMine ? 'default' : 'secondary'}
      size="sm"
      aria-pressed={isMine}
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
