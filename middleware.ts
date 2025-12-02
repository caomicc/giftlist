import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { match as matchLocale } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import { locales, defaultLocale } from '@/lib/i18n-config'

function getLocale(request: NextRequest): string {
  // Check if locale is stored in cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && locales.includes(cookieLocale as any)) {
    return cookieLocale
  }

  // Use Accept-Language header to determine locale
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages()
  const locale = matchLocale(languages, locales as unknown as string[], defaultLocale)

  return locale
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // If no locale in pathname, detect and redirect
  if (!pathnameHasLocale) {
    const locale = getLocale(request)
    request.nextUrl.pathname = `/${locale}${pathname}`
    
    // Set cookie for future requests
    const response = NextResponse.redirect(request.nextUrl)
    response.cookies.set('NEXT_LOCALE', locale, { 
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })
    return response
  }

  // Extract locale from pathname for auth checks
  const locale = pathname.split('/')[1]
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'

  // Auth logic
  const sessionToken = request.cookies.get('session-token')

  // Public routes that don't require authentication (without locale prefix)
  const publicRoutes = ['/auth/signin', '/auth/register', '/auth/verify-request', '/auth/verify', '/public', '/baby.webp']
  const isPublicRoute = publicRoutes.some(route => pathWithoutLocale.startsWith(route))

  // If user is not authenticated and trying to access protected route
  if (!sessionToken && !isPublicRoute) {
    return NextResponse.redirect(new URL(`/${locale}/auth/signin`, request.url))
  }

  // If user is authenticated and trying to access auth pages
  if (sessionToken && pathWithoutLocale.startsWith('/auth/')) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
