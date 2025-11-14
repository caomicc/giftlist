import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET() {
  try {
    // Check users table structure
    const usersTableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    // Check if users table exists and has data
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    
    // Check verification_tokens table
    const tokenTableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'verification_tokens' 
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    const tokenCount = await sql`SELECT COUNT(*) as count FROM verification_tokens`

    // Check sessions table
    const sessionsTableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'sessions' 
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    const sessionCount = await sql`SELECT COUNT(*) as count FROM sessions`

    return NextResponse.json({
      users: {
        structure: usersTableInfo,
        count: userCount[0].count
      },
      verification_tokens: {
        structure: tokenTableInfo,
        count: tokenCount[0].count
      },
      sessions: {
        structure: sessionsTableInfo,
        count: sessionCount[0].count
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Auth diagnostic failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to run auth diagnostic',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}