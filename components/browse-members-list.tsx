"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { useTranslation, formatMessage } from "./i18n-provider"

interface MemberList {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  itemCount: number
  claimedCount: number
}

interface FamilyMember {
  id: string
  name: string
  email: string
  lists: MemberList[]
  listCount: number
  totalItems: number
}

interface BrowseMembersListProps {
  members: FamilyMember[]
  locale: string
}

export function BrowseMembersList({ members, locale }: BrowseMembersListProps) {
  const { t } = useTranslation("gifts")
  const { t: tCommon } = useTranslation("common")

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const itemsLabel = (count: number) => {
    const message =
      count === 1
        ? tCommon.counts?.items || "{{count}} item"
        : tCommon.counts?.itemsPlural || "{{count}} items"
    return formatMessage(message, { count })
  }

  const listsLabel = (count: number) => {
    const message =
      count === 1
        ? tCommon.counts?.lists || "{{count}} list"
        : tCommon.counts?.listsPlural || "{{count}} lists"
    return formatMessage(message, { count })
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t.familyGifts?.noMembers || "No family members have wishlists yet."}</p>
      </div>
    )
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {members.map((member) => (
        <AccordionItem
          key={member.id}
          value={member.id}
          className="border rounded-lg bg-card overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50 min-h-[64px]">
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium truncate">{member.name}</p>
                <p className="text-sm text-muted-foreground">
                  {listsLabel(member.listCount)} · {itemsLabel(member.totalItems)}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="space-y-1 px-2">
              {member.lists.map((list) => (
                <Link
                  key={list.id}
                  href={`/${locale}/browse/${member.id}/${list.id}`}
                  className={cn(
                    "flex items-center justify-between w-full",
                    "px-4 py-3 rounded-md min-h-[48px]",
                    "hover:bg-accent transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{list.name}</span>
                      <Badge
                        variant={list.isPublic ? "default" : "secondary"}
                        className="shrink-0 text-xs"
                      >
                        {list.isPublic
                          ? t.familyGifts?.purchaseTracking?.tracked || "Tracked"
                          : t.familyGifts?.purchaseTracking?.surprise || "Surprise"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {itemsLabel(list.itemCount)}
                      {list.claimedCount > 0 && (
                        <span>
                          {" "}
                          ·{" "}
                          {formatMessage(tCommon.counts?.purchased || "{{count}} purchased", {
                            count: list.claimedCount,
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
