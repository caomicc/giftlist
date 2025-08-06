import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET() {
  try {
    const users = await sql`SELECT id, name, email, created_at FROM users ORDER BY name`
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
