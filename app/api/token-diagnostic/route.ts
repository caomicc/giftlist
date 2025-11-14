import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET() {
  try {
    // Check recent verification tokens
    const recentTokens = await sql`
      SELECT identifier, expires, created_at,
        CASE 
          WHEN expires < NOW() THEN 'expired'
          ELSE 'valid'
        END as status
      FROM verification_tokens 
      ORDER BY created_at DESC 
      LIMIT 10
    `

    // Check if any tokens belong to emails not in users table
    const orphanedTokens = await sql`
      SELECT vt.identifier, vt.expires, vt.created_at
      FROM verification_tokens vt
      LEFT JOIN users u ON vt.identifier = u.email
      WHERE u.email IS NULL
      ORDER BY vt.created_at DESC
    `

    // Count expired tokens
    const expiredCount = await sql`
      SELECT COUNT(*) as count 
      FROM verification_tokens 
      WHERE expires < NOW()
    `

    return NextResponse.json({
      recent_tokens: recentTokens,
      orphaned_tokens: orphanedTokens,
      expired_token_count: expiredCount[0].count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Token diagnostic failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to run token diagnostic',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'cleanup_expired') {
      // Clean up expired tokens
      const deletedTokens = await sql`
        DELETE FROM verification_tokens 
        WHERE expires < NOW()
        RETURNING identifier
      `

      return NextResponse.json({
        deleted_count: deletedTokens.length,
        deleted_emails: deletedTokens.map(t => t.identifier),
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Token cleanup failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to cleanup tokens',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
