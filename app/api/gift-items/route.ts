import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'
import { getApiUser } from '@/lib/auth'
import { scrubForViewer, unauthorized, forbidden } from '@/lib/gift-privacy'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('list_id')
    const userId = searchParams.get('user_id')

    const currentUser = await getApiUser()
    if (!currentUser) return unauthorized()

    let giftItems;

    if (listId) {
      // Get items for a specific list, checking permissions
      giftItems = await sql`
        SELECT 
          gi.*,
          l.is_public,
          l.name as list_name,
          l.owner_id as list_owner_id,
          u_owner.name as owner_name,
          u_purchaser.name as purchaser_name,
          -- Suggested by name: hide from owner if anonymous, show to others
          CASE 
            WHEN gi.suggested_by_id IS NOT NULL AND gi.is_anonymous_suggestion = TRUE AND l.owner_id = ${currentUser.id} THEN NULL
            ELSE u_suggester.name
          END as suggested_by_name,
          -- Comment count: for private lists, owner only sees their own comments count
          CASE 
            WHEN l.is_public = FALSE AND l.owner_id = ${currentUser.id} THEN
              (SELECT COUNT(*) FROM gift_item_comments c WHERE c.gift_item_id = gi.id AND c.user_id = ${currentUser.id})
            ELSE
              (SELECT COUNT(*) FROM gift_item_comments c WHERE c.gift_item_id = gi.id)
          END as comment_count
        FROM gift_items gi
        JOIN lists l ON gi.list_id = l.id
        LEFT JOIN users u_owner ON gi.owner_id = u_owner.id
        LEFT JOIN users u_purchaser ON gi.purchased_by = u_purchaser.id
        LEFT JOIN users u_suggester ON gi.suggested_by_id::uuid = u_suggester.id
        LEFT JOIN list_permissions lp ON l.id = lp.list_id AND lp.user_id = ${currentUser.id}
        WHERE gi.list_id = ${listId}
        AND gi.archived = FALSE
        AND (
          l.owner_id = ${currentUser.id}  -- User owns the list
          OR (lp.can_view = TRUE)  -- User has explicit permission to view
          OR (
            -- User doesn't have explicit permission, apply default based on permission mode
            lp.user_id IS NULL AND (
              -- No permissions at all = visible to all
              NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id)
              -- Only denials exist = "hidden from" mode, default is CAN view
              OR NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id AND lp2.can_view = TRUE)
            )
          )
        )
        ORDER BY gi.created_at DESC
      `
    } else if (userId) {
      // This branch applies no list-permission filter, so only allow it for your own items.
      if (userId !== currentUser.id) return forbidden()

      // Get all items owned by a specific user across all their lists
      giftItems = await sql`
        SELECT 
          gi.*,
          l.is_public,
          l.name as list_name,
          u_owner.name as owner_name,
          u_purchaser.name as purchaser_name,
          -- Suggested by name: hide from owner if anonymous, show to others
          CASE 
            WHEN gi.suggested_by_id IS NOT NULL AND gi.is_anonymous_suggestion = TRUE AND l.owner_id = ${currentUser.id} THEN NULL
            ELSE u_suggester.name
          END as suggested_by_name,
          -- Comment count: for private lists, owner only sees their own comments count
          CASE 
            WHEN l.is_public = FALSE AND l.owner_id = ${currentUser.id} THEN
              (SELECT COUNT(*) FROM gift_item_comments c WHERE c.gift_item_id = gi.id AND c.user_id = ${currentUser.id})
            ELSE
              (SELECT COUNT(*) FROM gift_item_comments c WHERE c.gift_item_id = gi.id)
          END as comment_count
        FROM gift_items gi
        JOIN lists l ON gi.list_id = l.id
        LEFT JOIN users u_owner ON gi.owner_id = u_owner.id
        LEFT JOIN users u_purchaser ON gi.purchased_by = u_purchaser.id
        LEFT JOIN users u_suggester ON gi.suggested_by_id::uuid = u_suggester.id
        WHERE gi.owner_id = ${userId}
        ORDER BY l.name, gi.created_at DESC
      `
    } else {
      // Get all items that the current user can view based on list permissions
      giftItems = await sql`
        SELECT 
          gi.*,
          l.is_public,
          l.name as list_name,
          l.owner_id as list_owner_id,
          u_owner.name as owner_name,
          u_purchaser.name as purchaser_name,
          -- Suggested by name: hide from owner if anonymous, show to others
          CASE 
            WHEN gi.suggested_by_id IS NOT NULL AND gi.is_anonymous_suggestion = TRUE AND l.owner_id = ${currentUser.id} THEN NULL
            ELSE u_suggester.name
          END as suggested_by_name,
          -- Comment count: for private lists, owner only sees their own comments count
          CASE 
            WHEN l.is_public = FALSE AND l.owner_id = ${currentUser.id} THEN
              (SELECT COUNT(*) FROM gift_item_comments c WHERE c.gift_item_id = gi.id AND c.user_id = ${currentUser.id})
            ELSE
              (SELECT COUNT(*) FROM gift_item_comments c WHERE c.gift_item_id = gi.id)
          END as comment_count
        FROM gift_items gi
        JOIN lists l ON gi.list_id = l.id
        LEFT JOIN users u_owner ON gi.owner_id = u_owner.id
        LEFT JOIN users u_purchaser ON gi.purchased_by = u_purchaser.id
        LEFT JOIN users u_suggester ON gi.suggested_by_id::uuid = u_suggester.id
        LEFT JOIN list_permissions lp ON l.id = lp.list_id AND lp.user_id = ${currentUser.id}
        WHERE gi.archived = FALSE
        AND (
          l.owner_id = ${currentUser.id}  -- User owns the list
          OR (lp.can_view = TRUE)  -- User has explicit permission to view
          OR (
            -- User doesn't have explicit permission, apply default based on permission mode
            lp.user_id IS NULL AND (
              -- No permissions at all = visible to all
              NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id)
              -- Only denials exist = "hidden from" mode, default is CAN view
              OR NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id AND lp2.can_view = TRUE)
            )
          )
        )
        ORDER BY gi.created_at DESC
      `
    }

    // Never tell the owner of a surprise list what has been bought
    giftItems = giftItems.map((row: any) => scrubForViewer(row, currentUser.id))

    return NextResponse.json({ giftItems })
  } catch (error) {
    console.error('Failed to fetch gift items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gift items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      description,
      price,
      link,
      image_url,
      owner_id,
      list_id,
      is_gift_card,
      is_group_gift,
      gift_card_target_amount,
      og_title,
      og_description,
      og_image,
      og_site_name
    } = await request.json()

    const currentUser = await getApiUser()
    if (!currentUser) return unauthorized()

    // You can only add items to your own lists
    if (owner_id !== currentUser.id) return forbidden()

    if (!list_id) {
      return NextResponse.json(
        { error: 'List ID is required' },
        { status: 400 }
      )
    }

    // Verify the list exists and belongs to the owner
    const [list] = await sql`
      SELECT id FROM lists
      WHERE id = ${list_id} AND owner_id = ${owner_id}
    `

    if (!list) {
      return NextResponse.json(
        { error: 'List not found or access denied' },
        { status: 404 }
      )
    }

    const data = await sql`
      INSERT INTO gift_items (
        name, description, price, link, image_url, owner_id, list_id, is_gift_card, is_group_gift, gift_card_target_amount,
        og_title, og_description, og_image, og_site_name
      )
      VALUES (
        ${name},
        ${description || null},
        ${price || null},
        ${link || null},
        ${image_url || null},
        ${owner_id},
        ${list_id},
        ${is_gift_card || false},
        ${is_group_gift || false},
        ${gift_card_target_amount || null},
        ${og_title || null},
        ${og_description || null},
        ${og_image || null},
        ${og_site_name || null}
      )
      RETURNING *
    `

    return NextResponse.json({ giftItem: data[0] })
  } catch (error) {
    console.error('Failed to add gift item:', error)
    return NextResponse.json(
      { error: 'Failed to add gift item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      )
    }

    const currentUser = await getApiUser()
    if (!currentUser) return unauthorized()

    const deleted = await sql`
      DELETE FROM gift_items
      WHERE id = ${itemId} AND owner_id = ${currentUser.id}
      RETURNING id
    `
    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Item not found or access denied' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete gift item:', error)
    return NextResponse.json(
      { error: 'Failed to delete gift item' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const {
      id,
      purchased_by,
      name,
      description,
      price,
      link,
      image_url,
      list_id,
      is_gift_card,
      is_group_gift,
      gift_card_target_amount,
      og_title,
      og_description,
      og_image,
      og_site_name,
      archived
    } = await request.json()

    const currentUser = await getApiUser()
    if (!currentUser) return unauthorized()

    const [existing] = await sql`
      SELECT gi.owner_id, gi.purchased_by, l.is_public
      FROM gift_items gi
      JOIN lists l ON gi.list_id = l.id
      WHERE gi.id = ${id}
    `
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    const isOwner = existing.owner_id === currentUser.id
    // Responses to the owner go through the surprise-list scrub
    const respond = (row: any) =>
      NextResponse.json({ giftItem: scrubForViewer(row, currentUser.id, existing.is_public) })

    // If updating archive status only
    if (archived !== undefined && !name && !description && !price && !link && !image_url && !list_id && !is_gift_card && is_group_gift === undefined && !gift_card_target_amount && !og_title && !og_description && !og_image && !og_site_name && purchased_by === undefined) {
      if (!isOwner) return forbidden()
      const data = await sql`
        UPDATE gift_items
        SET archived = ${archived}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return respond(data[0])
    }

    // If updating purchase status (regular items)
    if (purchased_by !== undefined && !name && !description && !price && !link && !image_url && !list_id && !is_gift_card && is_group_gift === undefined && !gift_card_target_amount && !og_title && !og_description && !og_image && !og_site_name && archived === undefined) {
      // You can't claim your own gift
      if (isOwner) return forbidden()
      // You can only claim for yourself
      if (purchased_by !== null && purchased_by !== currentUser.id) return forbidden()
      // Only the person who claimed it can release or change the claim
      if (existing.purchased_by && existing.purchased_by !== currentUser.id) {
        return forbidden('Already claimed by someone else')
      }
      const data = await sql`
        UPDATE gift_items
        SET purchased_by = ${purchased_by}
        WHERE id = ${id}
        RETURNING *
      `
      return respond(data[0])
    }

    // If updating gift item details
    if (name || description || price || link || image_url || list_id || is_gift_card !== undefined || is_group_gift !== undefined || gift_card_target_amount !== undefined || og_title || og_description || og_image || og_site_name || archived !== undefined) {
      if (!isOwner) return forbidden()

      // If list_id is being updated, verify ownership
      if (list_id) {
        const [listCheck] = await sql`
          SELECT owner_id FROM lists WHERE id = ${list_id}
        `

        // Get current item owner
        const [currentItem] = await sql`
          SELECT owner_id FROM gift_items WHERE id = ${id}
        `

        if (!listCheck || !currentItem || listCheck.owner_id !== currentItem.owner_id) {
          return NextResponse.json(
            { error: 'Cannot move item to a list you do not own' },
            { status: 403 }
          )
        }
      }
      const data = await sql`
        UPDATE gift_items
        SET
          name = ${name || null},
          description = ${description || null},
          price = ${price || null},
          link = ${link || null},
          image_url = ${image_url || null},
          list_id = ${list_id || null},
          is_gift_card = ${is_gift_card !== undefined ? is_gift_card : false},
          is_group_gift = ${is_group_gift !== undefined ? is_group_gift : false},
          gift_card_target_amount = ${gift_card_target_amount || null},
          og_title = ${og_title || null},
          og_description = ${og_description || null},
          og_image = ${og_image || null},
          og_site_name = ${og_site_name || null},
          archived = ${archived !== undefined ? archived : false},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return respond(data[0])
    }

    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to update gift item:', error)
    return NextResponse.json(
      { error: 'Failed to update gift item' },
      { status: 500 }
    )
  }
}
