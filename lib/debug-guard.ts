import { NextResponse } from 'next/server'

/**
 * Debug and diagnostic API routes (manual magic links, test users, schema fixes)
 * can read or mutate any account. They must never be reachable in production.
 *
 * Returns a 404 response when debug routes are disabled, or null when the
 * caller may proceed. Enable locally with ENABLE_DEBUG_ROUTES=true.
 */
export function guardDebugRoute(): NextResponse | null {
  const enabled =
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_DEBUG_ROUTES === 'true'

  if (enabled) return null

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
