import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { match as matchLocale } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import { locales, defaultLocale } from '@/lib/i18n-config'

const RETURN_TO_COOKIE = 'meep_return_to'

function getLocale(request: NextRequest): string {
  // Check if locale is stored in cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && locales.includes(cookieLocale as any)) {
    return cookieLocale
  }

  // Use Accept-Language header to determine locale
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  // Requests with no Accept-Language (curl, bots) yield ["*"], which matchLocale rejects
  const languages = new Negotiator({ headers: negotiatorHeaders })
    .languages()
    .filter((lang) => lang !== '*')

  try {
    return matchLocale(languages, locales as unknown as string[], defaultLocale)
  } catch {
    return defaultLocale
  }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip for favicon and common static files
  if (pathname === '/favicon.ico' || pathname === '/robots.txt' || pathname === '/sitemap.xml') {
    return NextResponse.next()
  }

  // Skip for static files with common extensions
  const staticExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.css', '.js', '.map', '.json', '.xml', '.txt']
  if (staticExtensions.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next()
  }

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
    const response = NextResponse.redirect(new URL(`/${locale}/auth/signin`, request.url))
    // Remember deep links (e.g. /en/add?url=… from the bookmarklet) so sign-in can return there.
    // Works for both password and magic-link sign-in because the return happens here, below.
    if (pathWithoutLocale !== '/') {
      response.cookies.set(RETURN_TO_COOKIE, pathname + request.nextUrl.search, {
        maxAge: 60 * 15,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      })
    }
    return response
  }

  // First request after signing in: go back to the page that sent you to sign-in
  const returnTo = request.cookies.get(RETURN_TO_COOKIE)?.value
  if (sessionToken && returnTo && !pathWithoutLocale.startsWith('/auth/')) {
    const isSafe = returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\')
    const current = pathname + request.nextUrl.search
    const response = isSafe && returnTo !== current
      ? NextResponse.redirect(new URL(returnTo, request.url))
      : NextResponse.next()
    response.cookies.delete(RETURN_TO_COOKIE)
    return response
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
     * - favicon.ico, robots.txt, sitemap.xml (metadata files)
     * - Static file extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|robots.txt|sitemap.xml).*)',
  ],
}
