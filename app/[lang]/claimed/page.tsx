import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { type Locale, getDictionary } from "@/lib/i18n"
import { ClaimedItemsList } from "@/components/claimed-items-list"

interface ClaimedPageProps {
  params: Promise<{ lang: string }>
}

export default async function ClaimedPage({ params }: ClaimedPageProps) {
  const { lang } = await params
  const locale = lang as Locale
  const currentUser = await requireAuth()
  const t = await getDictionary(locale, "gifts")
  const tCommon = await getDictionary(locale, "common")

  // Get all items claimed by current user, with owner and list info
  const claimedItems = await sql`
    SELECT 
      gi.id,
      gi.name,
      gi.description,
      gi.price,
      gi.link,
      gi.image_url,
      gi.og_image,
      gi.og_title,
      gi.purchased_by,
      gi.owner_id,
      gi.list_id,
      gi.is_gift_card,
      gi.is_group_gift,
      gi.gift_card_target_amount,
      gi.gift_card_total_purchased,
      gi.created_at,
      l.name as list_name,
      l.is_public,
      u_owner.name as owner_name
    FROM gift_items gi
    JOIN lists l ON gi.list_id = l.id
    JOIN users u_owner ON gi.owner_id = u_owner.id
    WHERE gi.purchased_by = ${currentUser.id}
    AND gi.archived = FALSE
    ORDER BY u_owner.name, l.name, gi.created_at DESC
  `

  // Also get gift card contributions
  const giftCardContributions = await sql`
    SELECT 
      gcp.gift_item_id,
      gcp.amount,
      gi.name as item_name,
      gi.price,
      gi.og_image,
      gi.image_url,
      gi.owner_id,
      gi.list_id,
      l.name as list_name,
      u_owner.name as owner_name
    FROM gift_card_purchases gcp
    JOIN gift_items gi ON gcp.gift_item_id = gi.id
    JOIN lists l ON gi.list_id = l.id
    JOIN users u_owner ON gi.owner_id = u_owner.id
    WHERE gcp.purchaser_id = ${currentUser.id}
    AND gi.archived = FALSE
    ORDER BY u_owner.name, gcp.created_at DESC
  `

  // Group items by recipient
  const groupedItems = claimedItems.reduce((acc: any, item: any) => {
    const ownerId = item.owner_id
    if (!acc[ownerId]) {
      acc[ownerId] = {
        ownerId,
        ownerName: item.owner_name,
        items: [],
      }
    }
    acc[ownerId].items.push(item)
    return acc
  }, {})

  // Add gift card contributions to grouped items
  giftCardContributions.forEach((contribution: any) => {
    const ownerId = contribution.owner_id
    if (!groupedItems[ownerId]) {
      groupedItems[ownerId] = {
        ownerId,
        ownerName: contribution.owner_name,
        items: [],
      }
    }
    // Check if we already have this item (from regular claims)
    const existingItem = groupedItems[ownerId].items.find(
      (i: any) => i.id === contribution.gift_item_id
    )
    if (!existingItem) {
      groupedItems[ownerId].items.push({
        id: contribution.gift_item_id,
        name: contribution.item_name,
        price: contribution.price,
        og_image: contribution.og_image,
        image_url: contribution.image_url,
        list_name: contribution.list_name,
        list_id: contribution.list_id,
        is_gift_card: true,
        gift_card_contribution: contribution.amount,
      })
    }
  })

  const recipients = Object.values(groupedItems)

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">
        {tCommon.bottomNav?.claimed || "Claimed Items"}
      </h1>

      <ClaimedItemsList
        recipients={recipients as any}
        currentUserId={currentUser.id}
        locale={locale}
      />
    </div>
  )
}
