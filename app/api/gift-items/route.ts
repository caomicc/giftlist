import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET() {
  try {
    const giftItems = await sql`SELECT * FROM gift_items ORDER BY created_at DESC`
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
      owner_id,
      is_gift_card,
      gift_card_target_amount,
      og_title,
      og_description,
      og_image,
      og_site_name
    } = await request.json()

    const data = await sql`
      INSERT INTO gift_items (
        name, description, price, link, owner_id, is_gift_card, gift_card_target_amount,
        og_title, og_description, og_image, og_site_name
      )
      VALUES (
        ${name},
        ${description || null},
        ${price || null},
        ${link || null},
        ${owner_id},
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
      is_gift_card,
      gift_card_target_amount,
      og_title,
      og_description,
      og_image,
      og_site_name
    } = await request.json()

    // If updating purchase status (regular items)
    if (purchased_by !== undefined && !name && !description && !price && !link && !is_gift_card && !gift_card_target_amount && !og_title && !og_description && !og_image && !og_site_name) {
      const data = await sql`
        UPDATE gift_items
        SET purchased_by = ${purchased_by}
        WHERE id = ${id}
        RETURNING *
      `
      return NextResponse.json({ giftItem: data[0] })
    }

    // If updating gift item details
    if (name || description || price || link || is_gift_card !== undefined || gift_card_target_amount !== undefined || og_title || og_description || og_image || og_site_name) {
      const data = await sql`
        UPDATE gift_items
        SET
          name = ${name || null},
          description = ${description || null},
          price = ${price || null},
          link = ${link || null},
          is_gift_card = ${is_gift_card !== undefined ? is_gift_card : false},
          gift_card_target_amount = ${gift_card_target_amount || null},
          og_title = ${og_title || null},
          og_description = ${og_description || null},
          og_image = ${og_image || null},
          og_site_name = ${og_site_name || null},
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
