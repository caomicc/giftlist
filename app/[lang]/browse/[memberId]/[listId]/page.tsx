import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { type Locale, getDictionary } from "@/lib/i18n"
import { notFound } from "next/navigation"
import { BrowseItemsList, type BrowseItem } from "@/components/browse-items-list"

interface BrowseListPageProps {
  params: Promise<{ lang: string; memberId: string; listId: string }>
}

export default async function BrowseListPage({ params }: BrowseListPageProps) {
  const { lang, memberId, listId } = await params
  const locale = lang as Locale
  const currentUser = await requireAuth()
  const t = await getDictionary(locale, "gifts")

  // Get the list owner info
  const [owner] = await sql`
    SELECT id, name, email FROM users WHERE id = ${memberId}
  `

  if (!owner) {
    notFound()
  }

  // Get the list info and verify permission
  const [list] = await sql`
    SELECT
      l.id, l.name, l.description, l.owner_id, l.is_public
    FROM lists l
    LEFT JOIN list_permissions lp ON l.id = lp.list_id AND lp.user_id = ${currentUser.id}
    WHERE l.id = ${listId}
    AND l.owner_id = ${memberId}
    AND (
      (lp.can_view = TRUE)
      OR (
        lp.user_id IS NULL AND (
          NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id)
          OR NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id AND lp2.can_view = TRUE)
        )
      )
    )
  `

  if (!list) {
    notFound()
  }

  // Get items for this list
  const items = await sql`
    SELECT
      gi.*,
      l.is_public,
      l.name as list_name,
      u_purchaser.name as purchaser_name,
      CASE
        WHEN gi.suggested_by_id IS NOT NULL AND gi.is_anonymous_suggestion = TRUE AND l.owner_id = ${currentUser.id} THEN NULL
        ELSE u_suggester.name
      END as suggested_by_name,
      (SELECT COUNT(*) FROM gift_item_comments c WHERE c.gift_item_id = gi.id) as comment_count
    FROM gift_items gi
    JOIN lists l ON gi.list_id = l.id
    LEFT JOIN users u_purchaser ON gi.purchased_by = u_purchaser.id
    LEFT JOIN users u_suggester ON gi.suggested_by_id::uuid = u_suggester.id
    WHERE gi.list_id = ${listId}
    AND gi.archived = FALSE
    ORDER BY gi.created_at DESC
  ` as BrowseItem[]

  // Get all users for purchaser name resolution
  const users = await sql`SELECT id, name FROM users` as { id: string; name: string }[]

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <BrowseItemsList
        items={items}
        list={{
          id: list.id,
          name: list.name,
          description: list.description,
          isPublic: list.is_public,
        }}
        owner={{
          id: owner.id,
          name: owner.name,
        }}
        currentUserId={currentUser.id}
        users={users}
        locale={locale}
      />
    </div>
  )
}
