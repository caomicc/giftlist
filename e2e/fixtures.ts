import { test as base, type Page } from '@playwright/test'

/**
 * Signs in a fake user without touching the database: the proxy only checks that a
 * session-token cookie exists, and client pages get the user from /api/user/profile.
 * Only works for client-rendered pages (e.g. /profile); server pages call requireAuth().
 */
export async function fakeSignIn(page: Page, user = { id: 'e2e-user', email: 'e2e@example.com', name: 'Test User' }) {
  await page.context().addCookies([{ name: 'session-token', value: 'e2e', url: 'http://localhost:3100' }])
  await page.route('**/api/user/profile', route => route.fulfill({ json: { ...user, created_at: new Date().toISOString() } }))
  await page.route('**/api/auth/check-password', route => route.fulfill({ json: { hasPassword: true } }))
}

export const test = base
export { expect } from '@playwright/test'
