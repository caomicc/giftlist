"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Plus, Eye, EyeOff, Archive } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AddItemDrawer } from "@/components/add-item-drawer"
import GiftItem from "@/components/gift-item"
import EditGiftDialog from "@/components/edit-gift-dialog"
import { useTranslation, formatMessage } from "./i18n-provider"
import type { GiftItem as GiftItemType, List } from "@/lib/neon"

interface UserList {
  id: string
  name: string
  is_public: boolean
  created_at: string
}

interface MyListDetailViewProps {
  list: List
  items: (GiftItemType & { purchaser_name: string | null; comment_count: number })[]
  archivedCount: number
  userLists: UserList[]
  currentUserId: string
  locale: string
}

export function MyListDetailView({
  list,
  items,
  archivedCount,
  userLists,
  currentUserId,
  locale,
}: MyListDetailViewProps) {
  const { t } = useTranslation("gifts")
  const { t: tCommon } = useTranslation("common")
  const router = useRouter()

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GiftItemType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchOGData = async (url: string) => {
    try {
      const response = await fetch(`/api/og-data?url=${encodeURIComponent(url)}`)
      if (!response.ok) return null
      return await response.json()
    } catch {
      return null
    }
  }

  const handleEditItem = (item: GiftItemType) => {
    setEditingItem(item)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(t.giftItem?.confirmDelete || "Are you sure you want to delete this item?")) {
      return
    }

    try {
      const response = await fetch(`/api/gift-items?id=${itemId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete item")
      router.refresh()
    } catch (error) {
      console.error("Failed to delete item:", error)
    }
  }

  const handleArchiveItem = async (itemId: string) => {
    try {
      const response = await fetch("/api/gift-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, archived: true }),
      })
      if (!response.ok) throw new Error("Failed to archive item")
      router.refresh()
    } catch (error) {
      console.error("Failed to archive item:", error)
    }
  }

  const handleUpdateItem = async (itemData: Partial<GiftItemType>) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/gift-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      })
      if (!response.ok) throw new Error("Failed to update item")
      setEditingItem(null)
      router.refresh()
    } catch (error) {
      console.error("Failed to update item:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with back navigation */}
      <div className="space-y-2">
        <Link
          href={`/${locale}/my-lists`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {tCommon.bottomNav?.myLists || "My Lists"}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold truncate">{list.name}</h1>
              <Button
                onClick={() => setIsAddDrawerOpen(true)}
                size="sm"
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.addForm?.buttons?.submit || "Add"}
              </Button>
            </div>
            {list.description && (
              <p className="text-muted-foreground mt-1">{list.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {formatMessage(
                items.length === 1
                  ? tCommon.counts?.items || "{{count}} item"
                  : tCommon.counts?.itemsPlural || "{{count}} items",
                { count: items.length }
              )}
              {archivedCount > 0 && (
                <span className="opacity-75">
                  {" · "}
                  {formatMessage(
                    tCommon.counts?.archivedPlural || "{{count}} archived",
                    { count: archivedCount }
                  )}
                </span>
              )}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={list.is_public ? "default" : "secondary"}
                className="shrink-0 cursor-help"
              >
                {list.is_public ? (
                  <Eye className="w-3 h-3 mr-1" />
                ) : (
                  <EyeOff className="w-3 h-3 mr-1" />
                )}
                {list.is_public
                  ? t.myGifts?.trackPurchases || "Tracked"
                  : t.myGifts?.keepSurprise || "Surprise"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {list.is_public
                  ? t.familyGifts?.purchaseTracking?.trackedDescription ||
                    "You can see who purchased items"
                  : t.familyGifts?.purchaseTracking?.surpriseDescription ||
                    "Purchase info is hidden from you"}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">{t.myGifts?.empty || "No gift ideas yet."}</p>
          <p className="text-sm mt-1">
            {t.myGifts?.description || "Add items you'd like to receive."}
          </p>
          <Button
            onClick={() => setIsAddDrawerOpen(true)}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t.addForm?.buttons?.submit || "Add Gift Idea"}
          </Button>
        </div>
      ) : (
        <div className="divide-y rounded-lg border bg-card overflow-hidden">
          {items.map((item) => (
            <GiftItem
              key={item.id}
              item={{
                id: item.id,
                name: item.name,
                description: item.description ?? undefined,
                price: item.price ?? undefined,
                link: item.link ?? undefined,
                purchased_by: item.purchased_by,
                owner_id: item.owner_id,
                list_id: item.list_id ?? undefined,
                is_public: list.is_public,
                is_gift_card: item.is_gift_card ?? undefined,
                is_group_gift: item.is_group_gift ?? undefined,
                gift_card_target_amount: item.gift_card_target_amount,
                gift_card_total_purchased: item.gift_card_total_purchased ?? undefined,
                og_title: item.og_title,
                og_description: item.og_description,
                og_image: item.og_image,
                og_site_name: item.og_site_name,
                archived: item.archived ?? undefined,
                image_url: item.image_url,
                comment_count: item.comment_count,
              }}
              currentUserId={currentUserId}
              purchaserName={item.purchaser_name || undefined}
              variant="my-gifts"
              onEdit={() => handleEditItem(item)}
              onDelete={() => handleDeleteItem(item.id)}
              onArchive={() => handleArchiveItem(item.id)}
            />
          ))}
        </div>
      )}

      {/* Add item button at bottom of list */}
      {items.length > 0 && (
        <Button
          onClick={() => setIsAddDrawerOpen(true)}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.addForm?.buttons?.submit || "Add Gift Idea"}
        </Button>
      )}

      {/* Add Item Drawer */}
      <AddItemDrawer
        open={isAddDrawerOpen}
        onOpenChange={setIsAddDrawerOpen}
        lists={userLists}
        defaultListId={list.id}
      />

      {/* Edit Dialog */}
      <EditGiftDialog
        editingItem={editingItem}
        userLists={userLists}
        isOpen={!!editingItem}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null)
        }}
        onUpdateGiftItem={handleUpdateItem}
        fetchOGData={fetchOGData}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
