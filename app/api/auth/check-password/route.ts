import { userHasPassword, getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const hasPassword = await userHasPassword(session.user.email)
    
    return NextResponse.json({ hasPassword })
  } catch (error) {
    console.error('Check password error:', error)
    return NextResponse.json(
      { error: 'Failed to check password status' },
      { status: 500 }
    )
  }
}
