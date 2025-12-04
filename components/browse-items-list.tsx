"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Gift } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import GiftItem from "@/components/gift-item"
import { useTranslation } from "./i18n-provider"

export interface BrowseItem {
  id: string
  name: string
  description: string | null
  price: string | null
  link: string | null
  image_url: string | null
  owner_id: string
  purchased_by: string | null
  list_id: string
  is_gift_card: boolean
  is_group_gift: boolean
  gift_card_target_amount: number | null
  gift_card_total_purchased: number
  og_title: string | null
  og_description: string | null
  og_image: string | null
  og_site_name: string | null
  archived: boolean
  created_at: string
  is_public: boolean
  list_name: string
  purchaser_name: string | null
  suggested_by_name: string | null
  comment_count: number
}

interface BrowseItemsListProps {
  items: BrowseItem[]
  list: {
    id: string
    name: string
    description: string | null
    isPublic: boolean
  }
  owner: {
    id: string
    name: string
  }
  currentUserId: string
  users: { id: string; name: string }[]
  locale: string
}

export function BrowseItemsList({
  items,
  list,
  owner,
  currentUserId,
  users,
  locale,
}: BrowseItemsListProps) {
  const { t } = useTranslation("gifts")
  const router = useRouter()

  const handleTogglePurchase = async (
    itemId: string,
    currentPurchasedBy: string | null
  ) => {
    try {
      const response = await fetch("/api/gift-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          purchased_by: currentPurchasedBy ? null : currentUserId,
        }),
      })

      if (!response.ok) throw new Error("Failed to update purchase status")

      // Refresh the page to get updated data
      router.refresh()
    } catch (error) {
      console.error("Error toggling purchase:", error)
    }
  }

  const handleGiftCardPurchase = async (itemId: string, amount: number) => {
    try {
      const response = await fetch("/api/gift-card-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gift_item_id: itemId,
          amount,
        }),
      })

      if (!response.ok) throw new Error("Failed to add gift card purchase")

      router.refresh()
    } catch (error) {
      console.error("Error adding gift card purchase:", error)
    }
  }

  const getPurchaserName = (purchasedBy: string | null) => {
    if (!purchasedBy) return undefined
    return users.find((u) => u.id === purchasedBy)?.name
  }

  return (
    <div className="space-y-4">
      {/* Header with back navigation */}
      <div className="space-y-2">
        <Link
          href={`/${locale}/browse`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {t.familyGifts?.backToBrowse || "Back to Browse"}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              {owner.name} · {list.name}
            </h1>
            {list.description && (
              <p className="text-muted-foreground mt-1">{list.description}</p>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={list.isPublic ? "default" : "secondary"}
                className="shrink-0"
              >
                {list.isPublic
                  ? t.familyGifts?.purchaseTracking?.tracked || "Tracked"
                  : t.familyGifts?.purchaseTracking?.surprise || "Surprise"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {list.isPublic
                  ? t.familyGifts?.purchaseTracking?.trackedDescription ||
                    "The list owner can see which items you've purchased"
                  : t.familyGifts?.purchaseTracking?.surpriseDescription ||
                    "The list owner cannot see which items you've purchased"}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t.familyGifts?.emptyList || "This list has no items yet."}</p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border bg-card overflow-hidden">
          {items.map((item) => (
            <GiftItem
              key={item.id}
              item={{
                id: item.id,
                name: item.name,
                description: item.description || undefined,
                price: item.price || undefined,
                link: item.link || undefined,
                image_url: item.image_url,
                owner_id: item.owner_id,
                purchased_by: item.purchased_by,
                list_id: item.list_id,
                is_gift_card: item.is_gift_card,
                is_group_gift: item.is_group_gift,
                gift_card_target_amount: item.gift_card_target_amount,
                gift_card_total_purchased: item.gift_card_total_purchased,
                og_title: item.og_title,
                og_description: item.og_description,
                og_image: item.og_image,
                og_site_name: item.og_site_name,
                archived: item.archived,
                is_public: list.isPublic,
                comment_count: item.comment_count,
                suggested_by_name: item.suggested_by_name,
              }}
              currentUserId={currentUserId}
              purchaserName={getPurchaserName(item.purchased_by)}
              variant="family-gifts"
              onTogglePurchase={handleTogglePurchase}
              onGiftCardPurchase={handleGiftCardPurchase}
            />
          ))}
        </div>
      )}
    </div>
  )
}
