import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { sql } from '@/lib/neon'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Generate magic link token
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store the token in database
    await sql`
      INSERT INTO verification_tokens (identifier, token, expires)
      VALUES (${email}, ${token}, ${expires})
      ON CONFLICT (identifier, token) DO UPDATE SET expires = ${expires}
    `

    // Generate the magic link
    const baseUrl = process.env.NEXTAUTH_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`

    return NextResponse.json({
      success: true,
      email,
      magic_link: magicLink,
      expires: expires.toISOString(),
      note: "This is a direct magic link bypass for testing when email service is down",
      instructions: "Copy this URL and paste it in your browser to sign in"
    })

  } catch (error) {
    console.error('Magic link generation failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate magic link',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
