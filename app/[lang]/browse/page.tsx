import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { type Locale, getDictionary } from "@/lib/i18n"
import { BrowseMembersList } from "@/components/browse-members-list"

interface BrowsePageProps {
  params: Promise<{ lang: string }>
}

export default async function BrowsePage({ params }: BrowsePageProps) {
  const { lang } = await params
  const locale = lang as Locale
  const currentUser = await requireAuth()
  const t = await getDictionary(locale, "gifts")

  // Get all family members except current user
  const users = await sql`
    SELECT id, name, email, created_at 
    FROM users 
    WHERE id != ${currentUser.id}
    ORDER BY name
  `

  // Get lists for each user with item counts, respecting permissions
  const listsWithCounts = await sql`
    SELECT 
      l.id,
      l.name,
      l.description,
      l.owner_id,
      l.is_public,
      COUNT(gi.id) FILTER (WHERE gi.archived = FALSE) as item_count,
      COUNT(gi.id) FILTER (WHERE gi.purchased_by IS NOT NULL AND gi.archived = FALSE) as claimed_count
    FROM lists l
    LEFT JOIN gift_items gi ON l.id = gi.list_id
    LEFT JOIN list_permissions lp ON l.id = lp.list_id AND lp.user_id = ${currentUser.id}
    WHERE l.owner_id != ${currentUser.id}
    AND (
      (lp.can_view = TRUE)
      OR (
        lp.user_id IS NULL AND (
          NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id)
          OR NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id AND lp2.can_view = TRUE)
        )
      )
    )
    GROUP BY l.id
    ORDER BY l.name
  `

  // Group lists by owner
  const memberData = users.map((user: any) => {
    const userLists = listsWithCounts.filter((list: any) => list.owner_id === user.id)
    const totalItems = userLists.reduce((sum: number, list: any) => sum + Number(list.item_count || 0), 0)
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      lists: userLists.map((list: any) => ({
        id: list.id,
        name: list.name,
        description: list.description,
        isPublic: list.is_public,
        itemCount: Number(list.item_count || 0),
        claimedCount: Number(list.claimed_count || 0),
      })),
      listCount: userLists.length,
      totalItems,
    }
  }).filter((member: any) => member.listCount > 0) // Only show members with visible lists

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">
        {t.familyGifts?.browseTitle || "Browse Wishlists"}
      </h1>
      
      <BrowseMembersList 
        members={memberData} 
        locale={locale}
      />
    </div>
  )
}
