import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('list_id')
    const userId = searchParams.get('user_id')
    
    // Get current user from session for permission checking
    const currentUser = request.headers.get('x-user-id') // We'll need to pass this from the client
    
    let giftItems;

    if (listId) {
      // Get items for a specific list, including visibility logic
      giftItems = await sql`
        SELECT 
          gi.*,
          l.is_public,
          l.name as list_name,
          l.owner_id as list_owner_id,
          u_owner.name as owner_name,
          u_purchaser.name as purchaser_name
        FROM gift_items gi
        JOIN lists l ON gi.list_id = l.id
        LEFT JOIN users u_owner ON gi.owner_id = u_owner.id
        LEFT JOIN users u_purchaser ON gi.purchased_by = u_purchaser.id
        WHERE gi.list_id = ${listId}
        ORDER BY gi.created_at DESC
      `
    } else if (userId) {
      // Get all items owned by a specific user across all their lists
      giftItems = await sql`
        SELECT 
          gi.*,
          l.is_public,
          l.name as list_name,
          u_owner.name as owner_name,
          u_purchaser.name as purchaser_name
        FROM gift_items gi
        JOIN lists l ON gi.list_id = l.id
        LEFT JOIN users u_owner ON gi.owner_id = u_owner.id
        LEFT JOIN users u_purchaser ON gi.purchased_by = u_purchaser.id
        WHERE gi.owner_id = ${userId}
        ORDER BY l.name, gi.created_at DESC
      `
    } else {
      // Get all items that the current user can view based on list permissions
      // For now, we'll get all items and filter on the client side since we need proper session handling
      giftItems = await sql`
        SELECT 
          gi.*,
          l.is_public,
          l.name as list_name,
          l.owner_id as list_owner_id,
          u_owner.name as owner_name,
          u_purchaser.name as purchaser_name
        FROM gift_items gi
        JOIN lists l ON gi.list_id = l.id
        LEFT JOIN users u_owner ON gi.owner_id = u_owner.id
        LEFT JOIN users u_purchaser ON gi.purchased_by = u_purchaser.id
        ORDER BY gi.created_at DESC
      `
    }

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
      gift_card_target_amount,
      og_title,
      og_description,
      og_image,
      og_site_name
    } = await request.json()

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
        name, description, price, link, image_url, owner_id, list_id, is_gift_card, gift_card_target_amount,
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

    await sql`DELETE FROM gift_items WHERE id = ${itemId}`
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
      gift_card_target_amount,
      og_title,
      og_description,
      og_image,
      og_site_name,
      archived
    } = await request.json()

    // If updating archive status only
    if (archived !== undefined && !name && !description && !price && !link && !image_url && !list_id && !is_gift_card && !gift_card_target_amount && !og_title && !og_description && !og_image && !og_site_name && purchased_by === undefined) {
      const data = await sql`
        UPDATE gift_items
        SET archived = ${archived}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return NextResponse.json({ giftItem: data[0] })
    }

    // If updating purchase status (regular items)
    if (purchased_by !== undefined && !name && !description && !price && !link && !image_url && !list_id && !is_gift_card && !gift_card_target_amount && !og_title && !og_description && !og_image && !og_site_name && archived === undefined) {
      const data = await sql`
        UPDATE gift_items
        SET purchased_by = ${purchased_by}
        WHERE id = ${id}
        RETURNING *
      `
      return NextResponse.json({ giftItem: data[0] })
    }

    // If updating gift item details
    if (name || description || price || link || image_url || list_id || is_gift_card !== undefined || gift_card_target_amount !== undefined || og_title || og_description || og_image || og_site_name || archived !== undefined) {
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
      return NextResponse.json({ giftItem: data[0] })
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
