import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'
import { getSession } from '@/lib/auth'
import { sendSuggestionNotification, sendSuggestionDeclinedNotification } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUser = session.user
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'incoming' | 'outgoing' | 'pending_count'

    if (type === 'pending_count') {
      // Get count of pending incoming suggestions
      const result = await sql`
        SELECT COUNT(*) as count
        FROM gift_suggestions
        WHERE target_user_id = ${currentUser.id}
        AND status = 'pending'
      `
      return NextResponse.json({ count: parseInt(result[0].count) })
    }

    if (type === 'outgoing') {
      // Get suggestions the current user has made to others
      const suggestions = await sql`
        SELECT
          gs.*,
          u_target.name as target_user_name
        FROM gift_suggestions gs
        LEFT JOIN users u_target ON gs.target_user_id::uuid = u_target.id
        WHERE gs.suggested_by_id = ${currentUser.id}
        ORDER BY gs.created_at DESC
      `
      return NextResponse.json({ suggestions })
    }

    // Default: Get incoming suggestions for the current user
    const suggestions = await sql`
      SELECT
        gs.*,
        u_suggester.name as suggested_by_name
      FROM gift_suggestions gs
      LEFT JOIN users u_suggester ON gs.suggested_by_id::uuid = u_suggester.id
      WHERE gs.target_user_id = ${currentUser.id}
      ORDER BY
        CASE WHEN gs.status = 'pending' THEN 0 ELSE 1 END,
        gs.created_at DESC
    `

    // Hide suggester name for anonymous pending suggestions
    const processedSuggestions = suggestions.map((s: any) => ({
      ...s,
      suggested_by_name: s.is_anonymous && s.status === 'pending' ? null : s.suggested_by_name,
      // Also hide suggested_by_id for anonymous pending
      suggested_by_id: s.is_anonymous && s.status === 'pending' ? null : s.suggested_by_id
    }))

    return NextResponse.json({ suggestions: processedSuggestions })
  } catch (error) {
    console.error('Failed to fetch suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUser = session.user
    const {
      target_user_id,
      name,
      description,
      price,
      link,
      image_url,
      is_anonymous,
      og_title,
      og_description,
      og_image,
      og_site_name
    } = await request.json()

    if (!target_user_id) {
      return NextResponse.json(
        { error: 'Target user is required' },
        { status: 400 }
      )
    }

    if (!name && !link) {
      return NextResponse.json(
        { error: 'Name or link is required' },
        { status: 400 }
      )
    }

    // Can't suggest to yourself
    if (target_user_id === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot suggest gifts to yourself' },
        { status: 400 }
      )
    }

    // Verify target user exists
    const [targetUser] = await sql`
      SELECT id, email, name FROM users WHERE id = ${target_user_id}::uuid
    `

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    const suggestion = await sql`
      INSERT INTO gift_suggestions (
        suggested_by_id,
        target_user_id,
        name,
        description,
        price,
        link,
        image_url,
        is_anonymous,
        og_title,
        og_description,
        og_image,
        og_site_name
      )
      VALUES (
        ${currentUser.id},
        ${target_user_id},
        ${name || og_title || 'Suggested Gift'},
        ${description || null},
        ${price || null},
        ${link || null},
        ${image_url || null},
        ${is_anonymous || false},
        ${og_title || null},
        ${og_description || null},
        ${og_image || null},
        ${og_site_name || null}
      )
      RETURNING *
    `

    // Send email notification to target user
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    try {
      await sendSuggestionNotification(
        targetUser.email,
        targetUser.name,
        is_anonymous ? null : (currentUser.name || 'Someone'),
        name || og_title || 'Suggested Gift',
        appUrl
      )
    } catch (emailError) {
      console.error('Failed to send suggestion notification email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ suggestion: suggestion[0] })
  } catch (error) {
    console.error('Failed to create suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to create suggestion' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUser = session.user
    const {
      id,
      action, // 'approve' | 'deny'
      list_id, // Required for approve
      denial_reason // Optional for deny
    } = await request.json()

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Suggestion ID and action are required' },
        { status: 400 }
      )
    }

    // Get the suggestion
    const [suggestion] = await sql`
      SELECT * FROM gift_suggestions WHERE id = ${id}
    `

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    // Only target user can approve/deny
    if (suggestion.target_user_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'Not authorized to modify this suggestion' },
        { status: 403 }
      )
    }

    // Can only modify pending suggestions
    if (suggestion.status !== 'pending') {
      return NextResponse.json(
        { error: 'Suggestion has already been processed' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      if (!list_id) {
        return NextResponse.json(
          { error: 'List ID is required for approval' },
          { status: 400 }
        )
      }

      // Verify the list belongs to current user
      const [list] = await sql`
        SELECT id FROM lists WHERE id = ${list_id} AND owner_id = ${currentUser.id}
      `

      if (!list) {
        return NextResponse.json(
          { error: 'List not found or access denied' },
          { status: 404 }
        )
      }

      // Create the gift item from suggestion
      const giftItem = await sql`
        INSERT INTO gift_items (
          name,
          description,
          price,
          link,
          image_url,
          owner_id,
          list_id,
          suggested_by_id,
          is_anonymous_suggestion,
          og_title,
          og_description,
          og_image,
          og_site_name
        )
        VALUES (
          ${suggestion.name},
          ${suggestion.description},
          ${suggestion.price},
          ${suggestion.link},
          ${suggestion.image_url},
          ${currentUser.id},
          ${list_id},
          ${suggestion.suggested_by_id},
          ${suggestion.is_anonymous},
          ${suggestion.og_title},
          ${suggestion.og_description},
          ${suggestion.og_image},
          ${suggestion.og_site_name}
        )
        RETURNING *
      `

      // Update suggestion status
      await sql`
        UPDATE gift_suggestions
        SET status = 'approved', updated_at = NOW()
        WHERE id = ${id}
      `

      // TODO: Send approval notification to suggester
      // const [suggester] = await sql`SELECT email, name FROM users WHERE id = ${suggestion.suggested_by_id}`
      // await sendApprovalNotification(suggester.email, suggestion.name)

      return NextResponse.json({
        success: true,
        giftItem: giftItem[0],
        message: 'Suggestion approved and added to your list'
      })
    }

    if (action === 'deny') {
      // Update suggestion status with optional reason
      await sql`
        UPDATE gift_suggestions
        SET
          status = 'denied',
          denial_reason = ${denial_reason || null},
          updated_at = NOW()
        WHERE id = ${id}
      `

      // Send denial notification to suggester
      try {
        const [suggester] = await sql`SELECT email, name FROM users WHERE id = ${suggestion.suggested_by_id}::uuid`
        if (suggester) {
          await sendSuggestionDeclinedNotification(
            suggester.email,
            suggester.name || 'there',
            currentUser.name || 'Someone',
            suggestion.name,
            denial_reason || undefined
          )
        }
      } catch (emailError) {
        console.error('Failed to send denial notification email:', emailError)
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Suggestion declined'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to process suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to process suggestion' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUser = session.user
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Suggestion ID is required' },
        { status: 400 }
      )
    }

    // Get the suggestion
    const [suggestion] = await sql`
      SELECT * FROM gift_suggestions WHERE id = ${id}
    `

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    // Only the suggester can delete their own pending suggestions
    if (suggestion.suggested_by_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this suggestion' },
        { status: 403 }
      )
    }

    if (suggestion.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only delete pending suggestions' },
        { status: 400 }
      )
    }

    await sql`DELETE FROM gift_suggestions WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to delete suggestion' },
      { status: 500 }
    )
  }
}
