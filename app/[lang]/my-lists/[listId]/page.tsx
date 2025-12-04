import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { type Locale, getDictionary } from "@/lib/i18n"
import { notFound, redirect } from "next/navigation"
import { MyListDetailView } from "@/components/my-list-detail-view"
import type { GiftItem, List } from "@/lib/neon"

interface MyListDetailPageProps {
  params: Promise<{ lang: string; listId: string }>
}

export default async function MyListDetailPage({ params }: MyListDetailPageProps) {
  const { lang, listId } = await params
  const locale = lang as Locale
  const currentUser = await requireAuth()

  // Get the list and verify ownership
  const lists = await sql`
    SELECT * FROM lists WHERE id = ${listId}
  ` as List[]

  if (lists.length === 0) {
    notFound()
  }

  const list = lists[0]

  // Redirect if user doesn't own this list
  if (list.owner_id !== currentUser.id) {
    redirect(`/${locale}/browse/${list.owner_id}/${listId}`)
  }

  // Get items for this list
  const items = await sql`
    SELECT
      gi.*,
      u_purchaser.name as purchaser_name,
      (SELECT COUNT(*) FROM gift_item_comments c WHERE c.gift_item_id = gi.id) as comment_count
    FROM gift_items gi
    LEFT JOIN users u_purchaser ON gi.purchased_by = u_purchaser.id
    WHERE gi.list_id = ${listId}
    AND gi.archived = FALSE
    ORDER BY gi.created_at DESC
  ` as (GiftItem & { purchaser_name: string | null; comment_count: number })[]

  // Get archived items count
  const archivedResult = await sql`
    SELECT COUNT(*) as count FROM gift_items WHERE list_id = ${listId} AND archived = TRUE
  ` as { count: string }[]
  const archivedCount = parseInt(archivedResult[0]?.count || "0")

  // Get user's lists for moving items
  const userLists = await sql`
    SELECT id, name, is_public, created_at FROM lists WHERE owner_id = ${currentUser.id} ORDER BY created_at ASC
  ` as { id: string; name: string; is_public: boolean; created_at: string }[]

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <MyListDetailView
        list={list}
        items={items}
        archivedCount={archivedCount}
        userLists={userLists}
        currentUserId={currentUser.id}
        locale={locale}
      />
    </div>
  )
}
