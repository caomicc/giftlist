"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Gift } from 'lucide-react'
import GiftItem from "./gift-item"

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
}

export default function FamilyGiftsList({
  currentUser,
  users,
  giftItems,
  onTogglePurchase,
  onGiftCardPurchase
}: FamilyGiftsListProps) {
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

        return (
          <AccordionItem key={member.id} value={member.id} className="">
            <AccordionTrigger className="hover:no-underline items-center py-3">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {member.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}'s Gift Lists</span>
                      {listCount > 1 && (
                        <Badge variant="outline" className="text-xs">
                          {listCount} lists
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <span>{memberGifts.length} item(s) • {purchasedCount} purchased</span>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                {memberGifts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{member.name} hasn't added any gift ideas yet.</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full md:px-3">
                    {Object.entries(giftsByList).map(([listId, listData]: [string, any]) => (
                      <AccordionItem key={listId} value={listId} className="w-full border-purple-200">
                        <AccordionTrigger className="hover:no-underline items-center py-2">
                          <div className="flex items-start gap-1 flex-col">
                            <h4 className="font-medium text-sm">{listData.name}</h4>
                            <div className="flex flex-row items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant={listData.isPublic ? "default" : "secondary"}
                                    className="text-xs cursor-help"
                                  >
                                    {listData.isPublic ? "Tracked" : "Surprise"}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{listData.isPublic
                                    ? "Track Purchases: The list owner can see which items you've purchased"
                                    : "Keep Surprise: The list owner cannot see which items you've purchased"}</p>
                                </TooltipContent>
                              </Tooltip>
                              <span className="text-xs text-muted-foreground">
                                {listData.items.length} item(s)
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-0">
                          <div className="px-1 md:px-2 border-purple-200 divide divide-y divide-purple-300">
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
