import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'
import { getApiUser } from '@/lib/auth'
import { unauthorized, forbidden } from '@/lib/gift-privacy'

async function loadGiftItem(giftItemId: string) {
  const [item] = await sql`
    SELECT gi.id, gi.owner_id, gi.is_gift_card, gi.gift_card_target_amount,
           gi.gift_card_total_purchased, l.is_public
    FROM gift_items gi
    JOIN lists l ON gi.list_id = l.id
    WHERE gi.id = ${giftItemId}
  `
  return item ?? null
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getApiUser()
    if (!currentUser) return unauthorized()

    const { searchParams } = new URL(request.url)
    const giftItemId = searchParams.get('gift_item_id')

    if (!giftItemId) {
      return NextResponse.json(
        { error: 'Gift item ID is required' },
        { status: 400 }
      )
    }

    const item = await loadGiftItem(giftItemId)
    if (!item) {
      return NextResponse.json({ error: 'Gift item not found' }, { status: 404 })
    }

    // The owner of a "Keep Surprise" list never learns who contributed or how much
    if (item.owner_id === currentUser.id && item.is_public === false) {
      return NextResponse.json({ purchases: [] })
    }

    const purchases = await sql`
      SELECT gcp.*, u.name as purchaser_name
      FROM gift_card_purchases gcp
      JOIN users u ON gcp.purchaser_id = u.id::text
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
    const currentUser = await getApiUser()
    if (!currentUser) return unauthorized()

    const { gift_item_id, amount } = await request.json()
    const numericAmount = Number(amount)

    if (!gift_item_id || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Gift item ID and a valid amount are required' },
        { status: 400 }
      )
    }

    const item = await loadGiftItem(gift_item_id)
    if (!item || !item.is_gift_card) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 })
    }
    if (item.owner_id === currentUser.id) {
      return forbidden("You can't contribute to your own gift card")
    }

    const target = Number(item.gift_card_target_amount) || 0
    const total = Number(item.gift_card_total_purchased) || 0
    if (target > 0 && numericAmount > target - total + 0.005) {
      return NextResponse.json(
        { error: 'Amount is more than what is left to reach the target', remaining: Math.max(target - total, 0) },
        { status: 400 }
      )
    }

    // The contributor is always the signed-in user, never a value from the request
    const data = await sql`
      INSERT INTO gift_card_purchases (gift_item_id, purchaser_id, amount)
      VALUES (${gift_item_id}, ${currentUser.id}, ${numericAmount})
      RETURNING *
    `

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
    const currentUser = await getApiUser()
    if (!currentUser) return unauthorized()

    const { searchParams } = new URL(request.url)
    const purchaseId = searchParams.get('id')

    if (!purchaseId) {
      return NextResponse.json(
        { error: 'Purchase ID is required' },
        { status: 400 }
      )
    }

    // Only the person who made a contribution can remove it
    const deleted = await sql`
      DELETE FROM gift_card_purchases
      WHERE id = ${purchaseId} AND purchaser_id = ${currentUser.id}
      RETURNING gift_item_id
    `

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Contribution not found or not yours' },
        { status: 404 }
      )
    }

    const giftItem = await sql`
      SELECT * FROM gift_items WHERE id = ${deleted[0].gift_item_id}
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

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getApiUser()
    if (!currentUser) return unauthorized()

    const { searchParams } = new URL(request.url)
    const purchaseId = searchParams.get('id')
    const { amount } = await request.json()
    const numericAmount = Number(amount)

    if (!purchaseId) {
      return NextResponse.json(
        { error: 'Purchase ID is required' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    // Only the person who made a contribution can change it
    const updatedPurchase = await sql`
      UPDATE gift_card_purchases
      SET amount = ${numericAmount}
      WHERE id = ${purchaseId} AND purchaser_id = ${currentUser.id}
      RETURNING *
    `

    if (updatedPurchase.length === 0) {
      return NextResponse.json(
        { error: 'Contribution not found or not yours' },
        { status: 404 }
      )
    }

    const giftItem = await sql`
      SELECT * FROM gift_items WHERE id = ${updatedPurchase[0].gift_item_id}
    `

    return NextResponse.json({
      purchase: updatedPurchase[0],
      giftItem: giftItem[0]
    })
  } catch (error) {
    console.error('Failed to update gift card purchase:', error)
    return NextResponse.json(
      { error: 'Failed to update gift card purchase' },
      { status: 500 }
    )
  }
}
