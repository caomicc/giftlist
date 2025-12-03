import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/neon'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Verify user owns the list
    const [list] = await sql`
      SELECT id FROM lists
      WHERE id = ${id} AND owner_id = ${user.id}
    `

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Get all permissions for this list
    const permissions = await sql`
      SELECT 
        lp.*,
        u.name as user_name,
        u.email as user_email
      FROM list_permissions lp
      JOIN users u ON lp.user_id = u.id
      WHERE lp.list_id = ${id}
      ORDER BY u.name
    `

    // Also get all family members to show who doesn't have permissions set
    const allUsers = await sql`
      SELECT id, name, email 
      FROM users 
      WHERE id != ${user.id}
      ORDER BY name
    `

    // Combine to show current state
    // If there are ANY explicit permissions set, we need to determine the default behavior
    const hasExplicitPermissions = permissions.length > 0
    const explicitDenials = permissions.filter(p => !p.can_view).length
    const explicitApprovals = permissions.filter(p => p.can_view).length

    // Determine default for users without explicit permissions:
    // - If there are more denials than approvals, it's likely "hidden from specific" mode, so default to true
    // - If there are more approvals than denials, it's likely "visible to specific" mode, so default to false
    // - If equal or no permissions, default to true (visible to all)
    let defaultCanView = true
    if (hasExplicitPermissions && explicitApprovals > 0 && explicitApprovals < allUsers.length) {
      // This looks like "visible to specific" mode
      defaultCanView = false
    }

    const userPermissions = allUsers.map(member => {
      const permission = permissions.find(p => p.user_id === member.id)
      return {
        user_id: member.id,
        user_name: member.name,
        user_email: member.email,
        can_view: permission?.can_view ?? defaultCanView
      }
    })

    return NextResponse.json({ permissions: userPermissions })
  } catch (error) {
    console.error('Error fetching list permissions:', error)
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { permissions } = await request.json()

    // Verify user owns the list
    const [list] = await sql`
      SELECT id FROM lists
      WHERE id = ${id} AND owner_id = ${user.id}
    `

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Update permissions for each user
    for (const permission of permissions) {
      await sql`
        INSERT INTO list_permissions (list_id, user_id, can_view)
        VALUES (${id}, ${permission.user_id}, ${permission.can_view})
        ON CONFLICT (list_id, user_id) 
        DO UPDATE SET 
          can_view = ${permission.can_view},
          updated_at = NOW()
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating list permissions:', error)
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 })
  }
}
