"use client"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Gift, Archive, Eye, EyeOff, Pencil, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import GiftItem from "./gift-item"
import type { GiftItem as GiftItemData } from "@/lib/neon"
import { useState } from "react"
import { useTranslation, formatMessage } from "./i18n-provider"

interface User {
  id: string
  name: string
  email: string
}

interface UserList {
  id: string
  name: string
  description?: string | null
  is_public: boolean
  created_at: string
  item_count?: number
}

interface MyGiftsListProps {
  currentUser: User
  userLists: UserList[]
  /** Lists haven't loaded yet: show placeholders rather than gifts under an "Unknown List" */
  listsLoading?: boolean
  activeMyGifts: GiftItemData[]
  archivedMyGifts: GiftItemData[]
  onEdit: (item: GiftItemData) => void
  onDelete: (itemId: string) => void
  onArchive: (itemId: string) => void
  /** Opens the edit dialog for one of my lists */
  onEditList?: (listId: string) => void
}

export default function MyGiftsList({
  currentUser,
  userLists,
  listsLoading,
  activeMyGifts,
  archivedMyGifts,
  onEdit,
  onDelete,
  onArchive,
  onEditList
}: MyGiftsListProps) {
  const { t } = useTranslation('gifts')
  const { t: tCommon } = useTranslation('common')
  const { t: tLists } = useTranslation('lists')
  // Lists start open. Track the ones the user closed, so lists that load late (or are new) still open.
  const [closedLists, setClosedLists] = useState<string[]>([])
  
  if (listsLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-6 w-40" />
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  }

  if (userLists.length === 0 && activeMyGifts.length === 0 && archivedMyGifts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{t.myGifts?.empty || 'No gift ideas yet. Add some items above!'}</p>
      </div>
    )
  }

  const listGroup = (listId: string) => {
    const listInfo = userLists.find(l => l.id === listId)
    return {
      name: listInfo?.name || (t.giftItem?.unknownList || 'Unknown List'),
      description: listInfo?.description || '',
      isPublic: listInfo?.is_public || false,
      createdAt: listInfo?.created_at || null,
      items: [] as GiftItemData[]
    }
  }

  // Group items by list; seed with every list so empty (new) lists still show
  const itemsByList: Record<string, ReturnType<typeof listGroup>> =
    Object.fromEntries(userLists.map(l => [l.id, listGroup(l.id)]))
  for (const item of activeMyGifts) {
    const listId = item.list_id || 'unknown'
    ;(itemsByList[listId] ??= listGroup(listId)).items.push(item)
  }

  // Group archived items by list
  const archivedByList: Record<string, ReturnType<typeof listGroup>> = {}
  for (const item of archivedMyGifts) {
    const listId = item.list_id || 'unknown'
    ;(archivedByList[listId] ??= listGroup(listId)).items.push(item)
  }

  const listIds = Object.keys(itemsByList)

  return (
    <div className="space-y-6">
      {/* Active Lists and Items */}
      <Accordion
        type="multiple"
        value={listIds.filter(id => !closedLists.includes(id))}
        onValueChange={open => setClosedLists(listIds.filter(id => !open.includes(id)))}
        className="w-full"
      >
        {Object.entries(itemsByList).map(([listId, listData]) => (
          <AccordionItem key={listId} value={listId}>
            {/* The edit button sits beside the trigger, never inside it (no button in a button) */}
            <div className="flex items-start gap-1 [&>h3]:flex-1 [&>h3]:min-w-0">
            <AccordionTrigger className="hover:no-underline items-center flex-1">
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{listData.name}</h3>
                  {listData.description && (
                    <p className="text-sm text-muted-foreground">{listData.description}</p>
                  )}
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {listData.isPublic
                      ? <Eye className="size-3.5" aria-hidden="true" />
                      : <EyeOff className="size-3.5" aria-hidden="true" />}
                    {listData.isPublic
                      ? (t.myGifts?.trackedLine || "You can see what's been bought")
                      : (t.myGifts?.surpriseLine || "Surprise: you won't see what's been bought")}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatMessage((listData.items.length === 1 ? tCommon.counts?.items : tCommon.counts?.itemsPlural) || '{{count}} items', { count: listData.items.length })}
                    </span>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            {onEditList && userLists.some(l => l.id === listId) && (
              <Button
                variant="ghost"
                size="icon"
                className="mt-3 size-8 text-muted-foreground hover:text-foreground"
                onClick={() => onEditList(listId)}
                aria-label={formatMessage(tLists.editList || 'Edit {{name}}', { name: listData.name })}
                title={formatMessage(tLists.editList || 'Edit {{name}}', { name: listData.name })}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </Button>
            )}
            </div>
            <AccordionContent>
              {listData.items.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t.myGifts?.empty || 'No gift ideas yet. Add some items above!'}
                </p>
              )}
              <div className="divide-y divide-border">
                {listData.items.map(item => (
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
        // Folded by default so it doesn't grow forever under the active lists
        <details className="group pt-4 border-t">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-sm text-sm font-medium text-muted-foreground select-none hover:text-foreground max-md:min-h-11 [&::-webkit-details-marker]:hidden">
            <Archive className="size-4" aria-hidden="true" />
            {formatMessage(t.myGifts?.archivedSummary || 'Archived items ({{count}})', { count: archivedMyGifts.length })}
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-4 space-y-6">
            {Object.entries(archivedByList).map(([listId, listData]) => (
              <div key={`archived-${listId}`} className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-dashed">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm opacity-75">{formatMessage(t.myGifts?.archivedList || "{{name}} (archived)", { name: listData.name })}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs opacity-60">
                        {formatMessage(tCommon.counts?.archived || '{{count}} archived items', { count: listData.items.length })}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {listData.items.map(item => (
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
        </details>
      )}
    </div>
  )
}
