import { setPassword, getBrowserSession } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await getBrowserSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to set a password' },
        { status: 401 }
      )
    }

    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    await setPassword(session.user.email, password)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set password error:', error)
    
    if (error instanceof Error && error.message === 'Password already set') {
      return NextResponse.json(
        { error: 'You already have a password. Change it from your profile.' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to set password' },
      { status: 500 }
    )
  }
}
