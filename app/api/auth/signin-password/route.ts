import { signInWithPassword, userHasPassword } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user exists and has no password
    const hasPassword = await userHasPassword(email)
    if (!hasPassword) {
      return NextResponse.json(
        { error: 'No password set for this account. Try using a magic link or set a password first.' },
        { status: 401 }
      )
    }

    const user = await signInWithPassword(email, password)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({ success: true, user: { email: user.email, name: user.name } })
  } catch (error) {
    console.error('Password sign in error:', error)
    return NextResponse.json(
      { error: 'Failed to sign in' },
      { status: 500 }
    )
  }
}
