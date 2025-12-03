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

    // Determine visibility mode based on explicit permissions
    const hasExplicitPermissions = permissions.length > 0

    if (!hasExplicitPermissions) {
      // No explicit permissions = visible to all (default mode)
      const userPermissions = allUsers.map(member => ({
        user_id: member.id,
        user_name: member.name,
        user_email: member.email,
        can_view: true,
        is_explicit: false
      }))
      return NextResponse.json({ permissions: userPermissions })
    }

    // Check if all explicit permissions are denials or all are approvals
    const explicitDenials = permissions.filter(p => !p.can_view).length
    const explicitApprovals = permissions.filter(p => p.can_view).length

    // Determine the visibility mode based on what's stored:
    // - Only denials (can_view=false): "hidden from specific" mode → new users default to CAN view
    // - Only approvals (can_view=true): "visible to specific" mode → new users default to CANNOT view
    // - Mixed or zero: shouldn't happen with our storage strategy, default to visible to all
    let defaultCanView = true
    if (explicitApprovals > 0 && explicitDenials === 0) {
      // Only approvals stored = "visible to specific" mode
      defaultCanView = false
    } else if (explicitDenials > 0 && explicitApprovals === 0) {
      // Only denials stored = "hidden from specific" mode
      defaultCanView = true
    }

    const userPermissions = allUsers.map(member => {
      const permission = permissions.find(p => p.user_id === member.id)
      return {
        user_id: member.id,
        user_name: member.name,
        user_email: member.email,
        can_view: permission?.can_view ?? defaultCanView,
        is_explicit: !!permission
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

    // If permissions array is empty, delete all permissions ("visible to all" mode)
    if (!permissions || permissions.length === 0) {
      await sql`
        DELETE FROM list_permissions
        WHERE list_id = ${id}
      `
    } else {
      // First, delete all existing permissions for this list
      await sql`
        DELETE FROM list_permissions
        WHERE list_id = ${id}
      `

      // Then insert the new permissions
      for (const permission of permissions) {
        await sql`
          INSERT INTO list_permissions (list_id, user_id, can_view)
          VALUES (${id}, ${permission.user_id}, ${permission.can_view})
        `
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating list permissions:', error)
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 })
  }
}
