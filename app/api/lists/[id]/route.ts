import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/neon'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Get the specific list
    const [list] = await sql`
      SELECT * FROM lists
      WHERE id = ${id} AND owner_id = ${user.id}
    `

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    return NextResponse.json(list)
  } catch (error) {
    console.error('Error fetching list:', error)
    return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { name, description, is_public, permissions } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 })
    }

    // Check if user owns this list
    const [existingList] = await sql`
      SELECT id FROM lists
      WHERE id = ${id} AND owner_id = ${user.id}
    `

    if (!existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Check if another list with this name already exists (excluding current list)
    const [nameConflict] = await sql`
      SELECT id FROM lists
      WHERE owner_id = ${user.id} AND name = ${name.trim()} AND id != ${id}
    `

    if (nameConflict) {
      return NextResponse.json({ error: 'A list with this name already exists' }, { status: 400 })
    }

    // Update list
    const [updatedList] = await sql`
      UPDATE lists
      SET 
        name = ${name.trim()},
        description = ${description || null},
        is_public = ${is_public !== false},
        updated_at = NOW()
      WHERE id = ${id} AND owner_id = ${user.id}
      RETURNING *
    `

    // Update permissions if provided
    if (permissions !== undefined) {
      // Delete existing permissions
      await sql`
        DELETE FROM list_permissions
        WHERE list_id = ${id}
      `

      // Insert new permissions
      if (Array.isArray(permissions) && permissions.length > 0) {
        for (const perm of permissions) {
          await sql`
            INSERT INTO list_permissions (list_id, user_id, can_view)
            VALUES (${id}, ${perm.user_id}, ${perm.can_view})
          `
        }
      }
    }

    return NextResponse.json(updatedList)
  } catch (error) {
    console.error('Error updating list:', error)
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Check if user owns this list and if it has any items
    const [listInfo] = await sql`
      SELECT 
        l.id,
        COUNT(gi.id) as item_count
      FROM lists l
      LEFT JOIN gift_items gi ON l.id = gi.list_id
      WHERE l.id = ${id} AND l.owner_id = ${user.id}
      GROUP BY l.id
    `

    if (!listInfo) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    if (listInfo.item_count > 0) {
      return NextResponse.json({
        error: 'Cannot delete list with items. Please move or delete all items first.'
      }, { status: 400 })
    }

    // Delete the list (permissions will be deleted automatically due to CASCADE)
    await sql`
      DELETE FROM lists
      WHERE id = ${id} AND owner_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting list:', error)
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 })
  }
}
