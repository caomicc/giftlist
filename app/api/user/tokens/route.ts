import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getBrowserSession } from '@/lib/auth'
import { unauthorized } from '@/lib/gift-privacy'
import { sql } from '@/lib/neon'

// Agent tokens are session rows with a name, sent as `Authorization: Bearer <token>`.
// ponytail: stored in plaintext like cookie sessions; hash both together if that ever changes.
// Only a browser session can list, create or revoke them (see getBrowserSession).

export async function GET() {
  const session = await getBrowserSession()
  if (!session) return unauthorized()

  const tokens = await sql`
    SELECT id, name, created_at, expires FROM sessions
    WHERE user_id = ${session.user.id} AND name IS NOT NULL AND expires > NOW()
    ORDER BY created_at DESC
  `
  return NextResponse.json({ tokens })
}

export async function POST(request: NextRequest) {
  const session = await getBrowserSession()
  if (!session) return unauthorized()

  const { name } = await request.json().catch(() => ({}))
  const label = typeof name === 'string' && name.trim() ? name.trim().slice(0, 100) : 'Agent'

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  const [row] = await sql`
    INSERT INTO sessions (session_token, user_id, expires, name)
    VALUES (${token}, ${session.user.id}, ${expires}, ${label})
    RETURNING id, name, created_at, expires
  `
  // The only time the token is shown
  return NextResponse.json({ token, ...row })
}

export async function DELETE(request: NextRequest) {
  const session = await getBrowserSession()
  if (!session) return unauthorized()

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Token ID is required' }, { status: 400 })

  const deleted = await sql`
    DELETE FROM sessions
    WHERE id = ${id} AND user_id = ${session.user.id} AND name IS NOT NULL
    RETURNING id
  `
  if (deleted.length === 0) return NextResponse.json({ error: 'Token not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
