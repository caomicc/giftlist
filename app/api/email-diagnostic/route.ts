import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await sql`
      SELECT id, email, name, email_verified, created_at
      FROM users
      WHERE email = ${email}
    `

    // Check tokens for this email
    const tokens = await sql`
      SELECT token, expires, created_at,
        CASE
          WHEN expires < NOW() THEN 'expired'
          ELSE 'valid'
        END as status
      FROM verification_tokens
      WHERE identifier = ${email}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      email,
      user_exists: user.length > 0,
      user: user[0] || null,
      tokens: tokens,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Email diagnostic failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to run email diagnostic',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
