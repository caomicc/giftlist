import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/neon'

// GET - Get user profile
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [user] = await sql`
      SELECT id, email, name, created_at, password_hash, digest_opt_in FROM users WHERE id = ${session.user.id}
    `

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      hasPassword: !!user.password_hash,
      digestOptIn: user.digest_opt_in
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update user profile: name and/or digestOptIn, whichever is sent
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, digestOptIn } = await request.json()

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (digestOptIn !== undefined && typeof digestOptIn !== 'boolean') {
      return NextResponse.json({ error: 'digestOptIn must be true or false' }, { status: 400 })
    }

    const [updatedUser] = await sql`
      UPDATE users
      SET name = COALESCE(${name?.trim() ?? null}, name),
          digest_opt_in = COALESCE(${digestOptIn ?? null}, digest_opt_in)
      WHERE id = ${session.user.id}
      RETURNING id, email, name, created_at, password_hash, digest_opt_in
    `

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      created_at: updatedUser.created_at,
      hasPassword: !!updatedUser.password_hash,
      digestOptIn: updatedUser.digest_opt_in
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
