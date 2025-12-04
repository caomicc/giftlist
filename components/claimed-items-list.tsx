"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Users, CheckCircle, Gift, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useTranslation, formatMessage } from "./i18n-provider"

interface ClaimedItem {
  id: string
  name: string
  description?: string
  price?: string
  link?: string
  image_url?: string
  og_image?: string
  list_name: string
  list_id: string
  is_gift_card?: boolean
  gift_card_contribution?: number
}

interface Recipient {
  ownerId: string
  ownerName: string
  items: ClaimedItem[]
}

interface ClaimedItemsListProps {
  recipients: Recipient[]
  currentUserId: string
  locale: string
}

export function ClaimedItemsList({
  recipients,
  currentUserId,
  locale,
}: ClaimedItemsListProps) {
  const { t } = useTranslation("gifts")
  const { t: tCommon } = useTranslation("common")
  const router = useRouter()

  const handleUnclaim = async (itemId: string) => {
    try {
      const response = await fetch("/api/gift-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          purchased_by: null,
        }),
      })

      if (!response.ok) throw new Error("Failed to unclaim item")

      router.refresh()
    } catch (error) {
      console.error("Error unclaiming item:", error)
    }
  }

  if (recipients.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">
            {t.claimed?.empty || "No items claimed yet"}
          </p>
          <p className="text-sm mt-1">
            {t.claimed?.emptyHelp ||
              "When you claim gifts from family members, they'll appear here."}
          </p>
          <Button asChild className="mt-4">
            <Link href={`/${locale}/browse`}>
              <Users className="w-4 h-4 mr-2" />
              {t.claimed?.browseLists || "Browse Family Lists"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {recipients.map((recipient) => (
        <div key={recipient.ownerId} className="space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>
              {formatMessage(t.claimed?.forRecipient || "For {{name}}", {
                name: recipient.ownerName,
              })}
            </span>
            <Badge variant="secondary" className="text-xs">
              {recipient.items.length}
            </Badge>
          </h2>

          <div className="space-y-2">
            {recipient.items.map((item) => {
              const previewImage = item.og_image || item.image_url

              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      {previewImage && (
                        <div className="shrink-0">
                          <img
                            src={previewImage}
                            alt={item.name}
                            className="size-14 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none"
                            }}
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span>
                            {formatMessage(t.claimed?.fromList || "from: {{list}}", {
                              list: item.list_name,
                            })}
                          </span>
                          {item.price && <span>· {item.price}</span>}
                        </div>
                        {item.is_gift_card && item.gift_card_contribution && (
                          <Badge
                            variant="outline"
                            className="mt-1 text-xs text-green-600 border-green-400"
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            {formatMessage(
                              t.claimed?.contributed || "Contributed {{amount}}",
                              { amount: `$${item.gift_card_contribution}` }
                            )}
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex items-center">
                        {!item.is_gift_card && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleUnclaim(item.id)}
                          >
                            {t.claimed?.unclaim || "Unclaim"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
