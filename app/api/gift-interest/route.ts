import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const giftItemId = searchParams.get('gift_item_id')

    // Get current user from authentication
    const currentUser = await requireAuth()

    if (!giftItemId) {
      return NextResponse.json(
        { error: 'Gift item ID is required' },
        { status: 400 }
      )
    }

    // Get all users interested in this gift item
    const interests = await sql`
      SELECT 
        gi.id,
        gi.gift_item_id,
        gi.user_id,
        gi.created_at,
        u.name as user_name,
        u.email as user_email
      FROM gift_interest gi
      JOIN users u ON gi.user_id = u.id::text
      WHERE gi.gift_item_id = ${giftItemId}
      ORDER BY gi.created_at ASC
    `

    return NextResponse.json({ interests })
  } catch (error) {
    console.error('Failed to fetch gift interest:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gift interest' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { gift_item_id, user_id } = await request.json()

    // Get current user from authentication
    const currentUser = await requireAuth()

    // Ensure the user can only add interest for themselves
    if (currentUser.id !== user_id) {
      return NextResponse.json(
        { error: 'You can only add interest for yourself' },
        { status: 403 }
      )
    }

    if (!gift_item_id || !user_id) {
      return NextResponse.json(
        { error: 'Gift item ID and user ID are required' },
        { status: 400 }
      )
    }

    // Check if user already expressed interest
    const existing = await sql`
      SELECT id FROM gift_interest
      WHERE gift_item_id = ${gift_item_id} AND user_id = ${user_id}
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'You have already expressed interest in this gift' },
        { status: 400 }
      )
    }

    // Add interest
    const data = await sql`
      INSERT INTO gift_interest (gift_item_id, user_id)
      VALUES (${gift_item_id}, ${user_id})
      RETURNING *
    `

    // Get user details
    const [userDetails] = await sql`
      SELECT name, email FROM users WHERE id::text = ${user_id}
    `

    return NextResponse.json({
      interest: {
        ...data[0],
        user_name: userDetails.name,
        user_email: userDetails.email
      }
    })
  } catch (error) {
    console.error('Failed to add gift interest:', error)
    return NextResponse.json(
      { error: 'Failed to add gift interest' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const giftItemId = searchParams.get('gift_item_id')
    const userId = searchParams.get('user_id')

    // Get current user from authentication
    const currentUser = await requireAuth()

    // Ensure the user can only remove their own interest
    if (currentUser.id !== userId) {
      return NextResponse.json(
        { error: 'You can only remove your own interest' },
        { status: 403 }
      )
    }

    if (!giftItemId || !userId) {
      return NextResponse.json(
        { error: 'Gift item ID and user ID are required' },
        { status: 400 }
      )
    }

    await sql`
      DELETE FROM gift_interest
      WHERE gift_item_id = ${giftItemId} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove gift interest:', error)
    return NextResponse.json(
      { error: 'Failed to remove gift interest' },
      { status: 500 }
    )
  }
}
