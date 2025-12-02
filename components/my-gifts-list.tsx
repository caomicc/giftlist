"use client"

import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Gift, Archive } from 'lucide-react'
import GiftItem from "./gift-item"
import { useTranslation, formatMessage } from "./i18n-provider"

interface User {
  id: string
  name: string
  email: string
}

interface UserList {
  id: string
  name: string
  description?: string
  is_public: boolean
  created_at: string
  item_count?: number
}

interface MyGiftsListProps {
  currentUser: User
  userLists: UserList[]
  activeMyGifts: any[]
  archivedMyGifts: any[]
  onEdit: (item: any) => void
  onDelete: (itemId: string) => void
  onArchive: (itemId: string) => void
}

export default function MyGiftsList({
  currentUser,
  userLists,
  activeMyGifts,
  archivedMyGifts,
  onEdit,
  onDelete,
  onArchive
}: MyGiftsListProps) {
  const { t } = useTranslation('gifts')
  const { t: tCommon } = useTranslation('common')
  
  if (activeMyGifts.length === 0 && archivedMyGifts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{t.myGifts?.empty || 'No gift ideas yet. Add some items above!'}</p>
      </div>
    )
  }

  // Group items by list
  const itemsByList = activeMyGifts.reduce((acc: any, item: any) => {
    const listId = item.list_id || 'unknown'
    if (!acc[listId]) {
      const listInfo = userLists.find(l => l.id === listId)
      acc[listId] = {
        name: listInfo?.name || (t.giftItem?.unknownList || 'Unknown List'),
        description: listInfo?.description || '',
        isPublic: listInfo?.is_public || false,
        createdAt: listInfo?.created_at || null,
        items: []
      }
    }
    acc[listId].items.push(item)
    return acc
  }, {})

  // Group archived items by list
  const archivedByList = archivedMyGifts.reduce((acc: any, item: any) => {
    const listId = item.list_id || 'unknown'
    if (!acc[listId]) {
      const listInfo = userLists.find(l => l.id === listId)
      acc[listId] = {
        name: listInfo?.name || (t.giftItem?.unknownList || 'Unknown List'),
        description: listInfo?.description || '',
        isPublic: listInfo?.is_public || false,
        createdAt: listInfo?.created_at || null,
        items: []
      }
    }
    acc[listId].items.push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Active Lists and Items */}
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(itemsByList).map(([listId, listData]: [string, any]) => (
          <AccordionItem key={listId} value={listId}>
            <AccordionTrigger className="hover:no-underline items-center relative">
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{listData.name}</h3>
                  {listData.description && (
                    <p className="text-sm text-muted-foreground">{listData.description}</p>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant={listData.isPublic ? "default" : "secondary"} className="text-xs absolute top-5 right-5 cursor-help">
                        {listData.isPublic ? (t.myGifts?.trackPurchases || "Track Purchases") : (t.myGifts?.keepSurprise || "Keep Surprise")}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{listData.isPublic
                        ? (t.familyGifts?.purchaseTracking?.trackedDescription || "Track Purchases: You can see which items family members have purchased from this list")
                        : (t.familyGifts?.purchaseTracking?.surpriseDescription || "Keep Surprise: You cannot see which items family members have purchased from this list")}</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatMessage(listData.items.length > 1 ? tCommon.counts?.itemsPlural : tCommon.counts?.items || '{{count}} items', { count: listData.items.length })}
                    </span>
                    {listData.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        • {formatMessage(tCommon.dates?.created || 'Created {{date}}', { date: new Date(listData.createdAt).toLocaleDateString() })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="divide divide-indigo-500">
                {listData.items.map((item: any) => (
                  <div key={item.id}>
                    <GiftItem
                      item={item}
                      currentUserId={currentUser.id}
                      variant="my-gifts"
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onArchive={onArchive}
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Archived Items by List */}
      {Object.keys(archivedByList).length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-lg font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <Archive className="w-5 h-5" />
            {t.myGifts?.archivedItems || 'Archived Items'}
          </h4>
          <div className="space-y-6">
            {Object.entries(archivedByList).map(([listId, listData]: [string, any]) => (
              <div key={`archived-${listId}`} className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-dashed">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm opacity-75">{listData.name} (Archived)</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs opacity-60">
                        {formatMessage(tCommon.counts?.archived || '{{count}} archived items', { count: listData.items.length })}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="divide divide-indigo-500">
                  {listData.items.map((item: any) => (
                    <GiftItem
                      key={item.id}
                      item={item}
                      currentUserId={currentUser.id}
                      variant="my-gifts"
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onArchive={onArchive}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
