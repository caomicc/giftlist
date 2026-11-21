import { test as base, type Page } from '@playwright/test'
export type { Page } from '@playwright/test'

/**
 * Signs in a fake user without touching the database: the proxy only checks that a
 * session-token cookie exists, and client pages get the user from /api/user/profile.
 * Only works for client-rendered pages (e.g. /profile); server pages call requireAuth().
 */
export async function fakeSignIn(page: Page, user = { id: 'e2e-user', email: 'e2e@example.com', name: 'Test User' }) {
  await page.context().addCookies([{ name: 'session-token', value: 'e2e', url: 'http://localhost:3100' }])
  await page.route('**/api/user/profile', route => route.fulfill({ json: { ...user, hasPassword: true, created_at: new Date().toISOString() } }))
  await page.route('**/api/auth/check-password', route => route.fulfill({ json: { hasPassword: true } }))
}

export const test = base
export { expect } from '@playwright/test'

/** Seeded users in db/seed.sql (local database only). */
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
export const SEED_PASSWORD = 'password123'
export const SEED = {
  alex: { id: id(1), email: 'alex@example.com', name: 'Alex Rivera' },
  sam: { id: id(2), email: 'sam@example.com', name: 'Sam Chen' },
  jordan: { id: id(3), email: 'jordan@example.com', name: 'Jordan Patel' },
  riley: { id: id(4), email: 'riley@example.com', name: 'Riley Okafor' },
}
export const SEED_GIFTS = {
  castIronSkillet: { id: id(201), name: 'Cast iron skillet' },
  chefsKnife: { id: id(206), name: "Chef's knife" },
  twoPersonTent: { id: id(205), name: 'Two-person tent' },
  bookshopGiftCard: { id: id(204), name: 'Bookshop gift card' },
}

/** Real password sign-in against the local database. */
export async function signInAs(page: Page, email: string) {
  await page.goto('/en/auth/signin')
  await page.getByLabel('Email').fill(email)
  await page.getByPlaceholder('Enter your password').fill(SEED_PASSWORD)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL(/\/en$/)
}

/** Opens a collapsed accordion (lists and family members) whose label contains `label`. */
export async function expand(page: Page, label: string) {
  const trigger = page.getByRole('button', { name: label }).first()
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click()
}

/** The row of one gift on my own list, which carries its Edit/Delete buttons. */
export const myGiftRow = (page: Page, name: string) =>
  page.getByText(name, { exact: true }).locator('xpath=ancestor::*[.//button[@aria-label="Delete"]][1]')
