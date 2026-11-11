import { NextResponse } from 'next/server'

/**
 * "Keep Surprise" lists (lists.is_public = false) must never tell the list
 * owner what has been bought or contributed. Hiding it in the UI is not enough:
 * the API response itself has to be scrubbed.
 */
type GiftRow = Record<string, any> & {
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

/** Scrub a single row when the viewer owns it on a surprise list. */
export function scrubForViewer<T extends GiftRow>(
  row: T,
  viewerId: string,
  isPublic?: boolean
): T {
  const withVisibility = isPublic === undefined ? row : { ...row, is_public: isPublic }
  return isSurpriseForViewer(withVisibility, viewerId) ? scrubPurchaseInfo(row) : row
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}
