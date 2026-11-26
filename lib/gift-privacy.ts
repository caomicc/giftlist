import { NextResponse } from 'next/server'
import { sql } from './neon'

/**
 * "Keep Surprise" lists (lists.is_public = false) must never tell the list
 * owner what has been bought or contributed. Hiding it in the UI is not enough:
 * the API response itself has to be scrubbed.
 */
export type GiftRow = Record<string, unknown> & {
  owner_id?: string
  list_owner_id?: string
  is_public?: boolean
}

export function isSurpriseForViewer(row: GiftRow, viewerId: string): boolean {
  const ownerId = row.list_owner_id ?? row.owner_id
  return ownerId === viewerId && row.is_public === false
}

export function scrubPurchaseInfo<T extends GiftRow>(row: T): T {
  return {
    ...row,
    purchased_by: null,
    purchaser_name: null,
    gift_card_total_purchased: 0,
  }
}

/**
 * Scrub a single row when the viewer owns it on a surprise list. Pass isPublic for rows without
 * it (UPDATE ... RETURNING *); it's added to the row so callers can tell scrubbed from unbought.
 */
export function scrubForViewer<T extends GiftRow>(
  row: T,
  viewerId: string,
  isPublic?: boolean
): T {
  const withVisibility = isPublic === undefined ? row : { ...row, is_public: isPublic }
  return isSurpriseForViewer(withVisibility, viewerId) ? scrubPurchaseInfo(withVisibility) : withVisibility
}

/**
 * A gift if `viewerId` may see the list it's on, else null. Use it in every route that takes a
 * gift id. Same rule as the list queries in app/api/gift-items/route.ts: owners see their own
 * lists; a list with "can view" grants is visible only to those people; otherwise everyone sees
 * it except people it is hidden from.
 */
export async function loadVisibleGift(giftId: string, viewerId: string) {
  const [gift] = await sql`
    SELECT gi.*, l.is_public, l.owner_id AS list_owner_id
    FROM gift_items gi
    JOIN lists l ON gi.list_id = l.id
    LEFT JOIN list_permissions lp ON l.id = lp.list_id AND lp.user_id = ${viewerId}
    WHERE gi.id = ${giftId}
    AND (
      l.owner_id = ${viewerId}
      OR lp.can_view = TRUE
      OR (
        lp.user_id IS NULL AND (
          NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id)
          OR NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id AND lp2.can_view = TRUE)
        )
      )
    )
  `
  return gift ?? null
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}
