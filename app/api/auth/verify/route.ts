import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLink } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  console.log('🔍 API Route - Verifying magic link:', { 
    token: token?.substring(0, 10) + '...', 
    email 
  })

  if (!token || !email) {
    console.log('❌ Missing token or email')
    return NextResponse.redirect(new URL('/auth/signin?error=invalid-link', request.url))
  }

  try {
    const user = await verifyMagicLink(token, email)
    
    if (!user) {
      console.log('❌ Verification failed')
      return NextResponse.redirect(new URL('/auth/signin?error=expired-link', request.url))
    }

    console.log('✅ Verification successful, redirecting to home')
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('❌ API Route error:', error)
    return NextResponse.redirect(new URL('/auth/signin?error=server-error', request.url))
  }
}
