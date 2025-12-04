import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { type Locale, getDictionary } from "@/lib/i18n"
import { MyListsView } from "@/components/my-lists-view"

interface MyListsPageProps {
  params: Promise<{ lang: string }>
}

export default async function MyListsPage({ params }: MyListsPageProps) {
  const { lang } = await params
  const locale = lang as Locale
  const currentUser = await requireAuth()
  const t = await getDictionary(locale, "gifts")
  const tCommon = await getDictionary(locale, "common")

  // Get user's lists with item counts
  const lists = await sql`
    SELECT
      l.*,
      COUNT(gi.id) FILTER (WHERE gi.archived = FALSE) as item_count,
      COUNT(gi.id) FILTER (WHERE gi.archived = TRUE) as archived_count
    FROM lists l
    LEFT JOIN gift_items gi ON l.id = gi.list_id
    WHERE l.owner_id = ${currentUser.id}
    GROUP BY l.id
    ORDER BY l.created_at ASC
  `

  // Get all users for permission management
  const allUsers = await sql`
    SELECT id, name FROM users WHERE id != ${currentUser.id} ORDER BY name
  ` as { id: string; name: string }[]

  // Get current permissions for each list
  const permissions = await sql`
    SELECT list_id, user_id, can_view
    FROM list_permissions
    WHERE list_id IN (SELECT id FROM lists WHERE owner_id = ${currentUser.id})
  `

  // Map permissions to lists
  const listsWithPermissions = lists.map((list: any) => ({
    ...list,
    item_count: Number(list.item_count || 0),
    archived_count: Number(list.archived_count || 0),
    permissions: permissions.filter((p: any) => p.list_id === list.id),
  }))

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">
        {tCommon.bottomNav?.myLists || "My Lists"}
      </h1>

      <MyListsView
        lists={listsWithPermissions}
        allUsers={allUsers}
        currentUserId={currentUser.id}
        locale={locale}
      />
    </div>
  )
}
