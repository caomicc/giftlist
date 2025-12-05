import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/neon'
import type { List } from '@/lib/neon'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user

    // Get all lists owned by the user
    const lists = await sql`
      SELECT 
        l.*,
        COUNT(gi.id) as item_count,
        COUNT(CASE WHEN gi.purchased_by IS NOT NULL THEN 1 END) as purchased_count
      FROM lists l
      LEFT JOIN gift_items gi ON l.id = gi.list_id AND NOT gi.archived
      WHERE l.owner_id = ${user.id}
      GROUP BY l.id
      ORDER BY l.created_at ASC
    `

    return NextResponse.json(lists)
  } catch (error) {
    console.error('Error fetching lists:', error)
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user
    const { name, description, is_public, hidden_from } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 })
    }

    // Check if user already has a list with this name
    const existing = await sql`
      SELECT id FROM lists
      WHERE owner_id = ${user.id} AND name = ${name.trim()}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: 'A list with this name already exists' }, { status: 400 })
    }

    // Create new list (removed is_visible column)
    const [newList] = await sql`
      INSERT INTO lists (name, description, owner_id, is_public)
      VALUES (${name.trim()}, ${description || null}, ${user.id}, ${is_public !== false})
      RETURNING *
    `

    // If hidden_from array is provided, create permission entries
    if (hidden_from && Array.isArray(hidden_from) && hidden_from.length > 0) {
      // Get all family members
      const allUsers = await sql`SELECT id FROM users WHERE id != ${user.id}`

      // Create permissions for each user
      for (const userId of allUsers.map(u => u.id)) {
        const canView = !hidden_from.includes(userId)
        await sql`
          INSERT INTO list_permissions (list_id, user_id, can_view)
          VALUES (${newList.id}, ${userId}, ${canView})
        `
      }
    }

    return NextResponse.json(newList, { status: 201 })
  } catch (error) {
    console.error('Error creating list:', error)
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
  }
}
