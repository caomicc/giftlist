"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Gift, Lightbulb, Eye, EyeOff } from 'lucide-react'
import GiftItem from "./gift-item"
import { useTranslation, formatMessage } from "./i18n-provider"

interface User {
  id: string
  name: string
  email: string
}

interface FamilyGiftsListProps {
  currentUser: User
  users: User[]
  giftItems: any[]
  onTogglePurchase: (itemId: string, currentPurchasedBy: string | null) => Promise<void>
  onGiftCardPurchase: (itemId: string, amount: number) => Promise<void>
  onSuggestGift?: (targetUserId: string) => void
}

export default function FamilyGiftsList({
  currentUser,
  users,
  giftItems,
  onTogglePurchase,
  onGiftCardPurchase,
  onSuggestGift
}: FamilyGiftsListProps) {
  const { t } = useTranslation('gifts')
  const { t: tCommon } = useTranslation('common')

  const getOtherMembers = () => users.filter((u: any) => u.id !== currentUser.id)
  const getMemberGifts = (memberId: string) => giftItems.filter((item: any) => item.owner_id === memberId && !item.archived)

  return (
    <Accordion type="single" collapsible className="w-full flex flex-col group">
      {getOtherMembers().map((member: any) => {
        const memberGifts = getMemberGifts(member.id)
        const purchasedCount = memberGifts.filter((item: any) => item.purchased_by).length

        // Group gifts by list to show privacy indicators
        const giftsByList = memberGifts.reduce((acc: any, item: any) => {
          const listId = item.list_id
          const listName = item.list_name || 'Unnamed List'
          const isPublic = item.is_public

          if (!acc[listId]) {
            acc[listId] = {
              name: listName,
              isPublic: isPublic,
              items: []
            }
          }
          acc[listId].items.push(item)
          return acc
        }, {})

        const listCount = Object.keys(giftsByList).length

        const summaryItemCount = memberGifts.length
        const summaryTranslationKey = summaryItemCount === 1 ? 'summary' : 'summaryPlural'

        const itemsTranslation = (count: number) => {
          const message = count === 1 ? (tCommon.counts?.items || '{{count}} item') : (tCommon.counts?.itemsPlural || '{{count}} items')
          return formatMessage(message, { count })
        }

        return (
          <AccordionItem key={member.id} value={member.id} className="">
            <AccordionTrigger className="hover:no-underline items-center py-3">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {member.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatMessage(t.familyGifts?.listTitle || "{{name}}'s Gift Lists", { name: member.name })}</span>
                      {listCount > 1 && (
                        <Badge variant="outline" className="text-xs">
                          {formatMessage(tCommon.counts?.listsPlural || '{{count}} lists', { count: listCount })}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <span>{formatMessage(t.familyGifts?.[summaryTranslationKey] || '{{itemCount}} item(s) • {{purchasedCount}} purchased', { itemCount: summaryItemCount, purchasedCount })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                {/* Suggest Gift Button */}
                {onSuggestGift && (
                  <div className="flex justify-end mb-3 px-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSuggestGift(member.id)
                      }}
                      className="text-suggestion border-suggestion/40 hover:bg-suggestion-soft"
                    >
                      <Lightbulb className="w-4 h-4 mr-1" />
                      {t.suggestions?.suggestGift || 'Suggest a Gift'}
                    </Button>
                  </div>
                )}
                
                {memberGifts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{formatMessage(t.familyGifts?.empty || "{{name}} hasn't added any gift ideas yet.", { name: member.name })}</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full md:px-3">
                    {Object.entries(giftsByList).map(([listId, listData]: [string, any]) => (
                      <AccordionItem key={listId} value={listId} className="w-full">
                        <AccordionTrigger className="hover:no-underline items-center py-2">
                          <div className="flex items-start gap-1 flex-col">
                            <h4 className="font-medium text-sm">{listData.name}</h4>
                            <div className="flex flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                {listData.isPublic
                                  ? <Eye className="size-3.5" aria-hidden="true" />
                                  : <EyeOff className="size-3.5" aria-hidden="true" />}
                                {formatMessage(
                                  listData.isPublic
                                    ? (t.familyGifts?.purchaseTracking?.trackedLine || "{{name}} can see what you buy")
                                    : (t.familyGifts?.purchaseTracking?.surpriseLine || "{{name}} won't see what you buy"),
                                  { name: member.name }
                                )}
                              </span>
                              <span aria-hidden="true" className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">
                                {itemsTranslation(listData.items.length)}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-0">
                          <div className="px-1 md:px-2 divide-y divide-border">
                            {listData.items.map((item: any) => {
                              const purchaserName = item.purchased_by
                                ? users.find((u: any) => u.id === item.purchased_by)?.name
                                : null

                              return (
                                <GiftItem
                                  key={item.id}
                                  item={item}
                                  currentUserId={currentUser.id}
                                  purchaserName={purchaserName || undefined}
                                  variant="family-gifts"
                                  onTogglePurchase={onTogglePurchase}
                                  onGiftCardPurchase={onGiftCardPurchase}
                                />
                              )
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
