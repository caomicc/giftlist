import { signOut } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function POST() {
  try {
    await signOut()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sign out error:', error)
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    )
  }
}

export async function GET() {
  await signOut()
  redirect('/auth/signin')
}
