import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth()
    const { searchParams } = new URL(request.url)
    const giftItemId = searchParams.get('gift_item_id')

    if (!giftItemId) {
      return NextResponse.json(
        { error: 'gift_item_id is required' },
        { status: 400 }
      )
    }

    // First, verify the user can view this gift item based on list permissions
    const [giftItem] = await sql`
      SELECT 
        gi.id,
        gi.owner_id,
        l.id as list_id,
        l.is_public,
        l.owner_id as list_owner_id
      FROM gift_items gi
      JOIN lists l ON gi.list_id = l.id
      LEFT JOIN list_permissions lp ON l.id = lp.list_id AND lp.user_id = ${currentUser.id}
      WHERE gi.id = ${giftItemId}
      AND (
        l.owner_id = ${currentUser.id}
        OR (lp.can_view = TRUE)
        OR (
          lp.user_id IS NULL AND (
            NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id)
            OR NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id AND lp2.can_view = TRUE)
          )
        )
      )
    `

    if (!giftItem) {
      return NextResponse.json(
        { error: 'Gift item not found or access denied' },
        { status: 404 }
      )
    }

    // For private lists, the owner should only see their own comments
    // (other comments are hidden to maintain surprise)
    const isOwnerViewingPrivateList = !giftItem.is_public && giftItem.list_owner_id === currentUser.id

    let comments
    if (isOwnerViewingPrivateList) {
      // Owner of private list only sees their own comments
      comments = await sql`
        SELECT 
          c.id,
          c.gift_item_id,
          c.user_id,
          c.content,
          c.created_at,
          c.updated_at,
          u.name as user_name
        FROM gift_item_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.gift_item_id = ${giftItemId}
        AND c.user_id = ${currentUser.id}
        ORDER BY c.created_at ASC
      `
    } else {
      // Others can see all comments
      comments = await sql`
        SELECT 
          c.id,
          c.gift_item_id,
          c.user_id,
          c.content,
          c.created_at,
          c.updated_at,
          u.name as user_name
        FROM gift_item_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.gift_item_id = ${giftItemId}
        ORDER BY c.created_at ASC
      `
    }

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth()
    const { gift_item_id, content } = await request.json()

    if (!gift_item_id || !content?.trim()) {
      return NextResponse.json(
        { error: 'gift_item_id and content are required' },
        { status: 400 }
      )
    }

    // Verify the user can view this gift item (and thus can comment)
    const [giftItem] = await sql`
      SELECT 
        gi.id,
        l.id as list_id
      FROM gift_items gi
      JOIN lists l ON gi.list_id = l.id
      LEFT JOIN list_permissions lp ON l.id = lp.list_id AND lp.user_id = ${currentUser.id}
      WHERE gi.id = ${gift_item_id}
      AND (
        l.owner_id = ${currentUser.id}
        OR (lp.can_view = TRUE)
        OR (
          lp.user_id IS NULL AND (
            NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id)
            OR NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id AND lp2.can_view = TRUE)
          )
        )
      )
    `

    if (!giftItem) {
      return NextResponse.json(
        { error: 'Gift item not found or access denied' },
        { status: 404 }
      )
    }

    const [comment] = await sql`
      INSERT INTO gift_item_comments (gift_item_id, user_id, content)
      VALUES (${gift_item_id}, ${currentUser.id}, ${content.trim()})
      RETURNING *
    `

    // Return with user name
    const [commentWithUser] = await sql`
      SELECT 
        c.*,
        u.name as user_name
      FROM gift_item_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ${comment.id}
    `

    return NextResponse.json({ comment: commentWithUser })
  } catch (error) {
    console.error('Failed to add comment:', error)
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await requireAuth()
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('id')

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      )
    }

    // Verify the comment belongs to the current user
    const [comment] = await sql`
      SELECT id, user_id FROM gift_item_comments
      WHERE id = ${commentId}
    `

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (comment.user_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      )
    }

    await sql`DELETE FROM gift_item_comments WHERE id = ${commentId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
