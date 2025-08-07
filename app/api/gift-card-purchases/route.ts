import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const giftItemId = searchParams.get('gift_item_id')

    if (!giftItemId) {
      return NextResponse.json(
        { error: 'Gift item ID is required' },
        { status: 400 }
      )
    }

    const purchases = await sql`
      SELECT gcp.*, fm.name as purchaser_name 
      FROM gift_card_purchases gcp
      JOIN family_members fm ON gcp.purchaser_id = fm.id
      WHERE gcp.gift_item_id = ${giftItemId}
      ORDER BY gcp.created_at DESC
    `

    return NextResponse.json({ purchases })
  } catch (error) {
    console.error('Failed to fetch gift card purchases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gift card purchases' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { gift_item_id, purchaser_id, amount } = await request.json()

    if (!gift_item_id || !purchaser_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Gift item ID, purchaser ID, and valid amount are required' },
        { status: 400 }
      )
    }

    // Insert the purchase
    const data = await sql`
      INSERT INTO gift_card_purchases (gift_item_id, purchaser_id, amount)
      VALUES (${gift_item_id}, ${purchaser_id}, ${amount})
      RETURNING *
    `

    // Get the updated gift item with new total
    const giftItem = await sql`
      SELECT * FROM gift_items WHERE id = ${gift_item_id}
    `

    return NextResponse.json({
      purchase: data[0],
      giftItem: giftItem[0]
    })
  } catch (error) {
    console.error('Failed to add gift card purchase:', error)
    return NextResponse.json(
      { error: 'Failed to add gift card purchase' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const purchaseId = searchParams.get('id')

    if (!purchaseId) {
      return NextResponse.json(
        { error: 'Purchase ID is required' },
        { status: 400 }
      )
    }

    // Get the gift item id before deleting
    const purchase = await sql`
      SELECT gift_item_id FROM gift_card_purchases WHERE id = ${purchaseId}
    `

    if (purchase.length === 0) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Delete the purchase
    await sql`DELETE FROM gift_card_purchases WHERE id = ${purchaseId}`

    // Get the updated gift item
    const giftItem = await sql`
      SELECT * FROM gift_items WHERE id = ${purchase[0].gift_item_id}
    `

    return NextResponse.json({
      success: true,
      giftItem: giftItem[0]
    })
  } catch (error) {
    console.error('Failed to delete gift card purchase:', error)
    return NextResponse.json(
      { error: 'Failed to delete gift card purchase' },
      { status: 500 }
    )
  }
}
