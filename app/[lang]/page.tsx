import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { type Locale, getDictionary } from "@/lib/i18n"
import { HomeView } from "@/components/home-view"
import type { GiftSuggestion, List } from "@/lib/neon"
import type { ActivityItem } from "@/components/activity-feed"

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const user = await requireAuth()
  const { lang } = await params
  const locale = lang as Locale

  // Fetch recent activity (last 20 updates across all visible lists)
  // Combines gift item updates AND comments
  // Shows: activity on OTHER people's lists (that you can view)
  // Plus: activity on YOUR OWN lists only if is_public=true (tracked)
  const activityItems = await sql`
    WITH visible_lists AS (
      -- Lists owned by others that current user can view
      SELECT l.id, l.owner_id, l.is_public
      FROM lists l
      LEFT JOIN list_permissions lp ON l.id = lp.list_id AND lp.user_id = ${user.id}
      WHERE l.owner_id != ${user.id}
      AND (
        (lp.can_view = TRUE)
        OR (
          lp.user_id IS NULL AND (
            NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id)
            OR NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id AND lp2.can_view = TRUE)
          )
        )
      )
      UNION ALL
      -- User's own lists, but only if tracked (is_public = true)
      SELECT l.id, l.owner_id, l.is_public
      FROM lists l
      WHERE l.owner_id = ${user.id}
      AND l.is_public = TRUE
    ),
    gift_updates AS (
      SELECT 
        gi.id,
        gi.name as item_name,
        gi.owner_id,
        gi.purchased_by,
        gi.created_at,
        gi.updated_at,
        l.name as list_name,
        u_owner.name as owner_name,
        u_purchaser.name as actor_name,
        gi.purchased_by as actor_id,
        NULL::text as comment_preview,
        CASE 
          WHEN gi.purchased_by IS NOT NULL AND gi.updated_at > gi.created_at + interval '1 minute' THEN 'claimed'
          WHEN gi.updated_at > gi.created_at + interval '1 minute' THEN 'updated'
          ELSE 'added'
        END as type
      FROM gift_items gi
      JOIN lists l ON gi.list_id = l.id
      JOIN users u_owner ON gi.owner_id = u_owner.id
      LEFT JOIN users u_purchaser ON gi.purchased_by = u_purchaser.id
      WHERE gi.archived = FALSE
      AND l.id IN (SELECT id FROM visible_lists)
    ),
    comment_updates AS (
      SELECT 
        c.id,
        gi.name as item_name,
        gi.owner_id,
        NULL::uuid as purchased_by,
        c.created_at,
        c.created_at as updated_at,
        l.name as list_name,
        u_owner.name as owner_name,
        u_commenter.name as actor_name,
        c.user_id as actor_id,
        LEFT(c.content, 100) as comment_preview,
        'commented' as type
      FROM gift_item_comments c
      JOIN gift_items gi ON c.gift_item_id = gi.id
      JOIN lists l ON gi.list_id = l.id
      JOIN users u_owner ON gi.owner_id = u_owner.id
      JOIN users u_commenter ON c.user_id = u_commenter.id
      WHERE gi.archived = FALSE
      AND l.id IN (SELECT id FROM visible_lists)
    ),
    all_activity AS (
      SELECT * FROM gift_updates
      UNION ALL
      SELECT * FROM comment_updates
    )
    SELECT * FROM all_activity
    ORDER BY updated_at DESC
    LIMIT 20
  ` as ActivityItem[]

  // Fetch incoming suggestions
  const incomingSuggestions = await sql`
    SELECT
      gs.*,
      u_suggester.name as suggested_by_name
    FROM gift_suggestions gs
    LEFT JOIN users u_suggester ON gs.suggested_by_id::uuid = u_suggester.id
    WHERE gs.target_user_id = ${user.id}
    ORDER BY
      CASE WHEN gs.status = 'pending' THEN 0 ELSE 1 END,
      gs.created_at DESC
  ` as GiftSuggestion[]

  // Hide suggester for anonymous pending suggestions
  const processedIncoming = incomingSuggestions.map((s) => ({
    ...s,
    suggested_by_name: s.is_anonymous && s.status === "pending" ? null : s.suggested_by_name,
    suggested_by_id: s.is_anonymous && s.status === "pending" ? null : s.suggested_by_id,
  })) as GiftSuggestion[]

  // Fetch outgoing suggestions
  const outgoingSuggestions = await sql`
    SELECT
      gs.*,
      u_target.name as target_user_name
    FROM gift_suggestions gs
    LEFT JOIN users u_target ON gs.target_user_id::uuid = u_target.id
    WHERE gs.suggested_by_id = ${user.id}
    ORDER BY gs.created_at DESC
  ` as GiftSuggestion[]

  // Get pending count
  const pendingCount = processedIncoming.filter((s) => s.status === "pending").length

  // Get user's lists for suggestion approval
  const userLists = await sql`
    SELECT * FROM lists WHERE owner_id = ${user.id} ORDER BY created_at ASC
  ` as List[]

  return (
    <main className="container max-w-2xl mx-auto px-4 py-6">
      <HomeView
        activities={activityItems}
        incomingSuggestions={processedIncoming}
        outgoingSuggestions={outgoingSuggestions}
        userLists={userLists}
        pendingSuggestionCount={pendingCount}
        currentUserId={user.id}
        locale={locale}
      />
    </main>
  )
}
