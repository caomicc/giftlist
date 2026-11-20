import { test, expect, type Page } from '@playwright/test'
import { seasonForMonth } from '../lib/seasons.ts'

const SIGNIN = '/en/auth/signin'
// Chrome serialises oklch(1 0 0) as lab(100% 0 0)
const LIGHT_BACKGROUND = /^(oklch\(1 0 0\)|lab\(100% 0 0\))$/

async function openWithTheme(page: Page, theme: string | null) {
  await page.addInitScript(t => {
    if (t === null) localStorage.removeItem('theme')
    else localStorage.setItem('theme', t)
  }, theme)
  await page.goto(SIGNIN)
}

const token = (page: Page, name: string) =>
  page.evaluate(n => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name)

test('defaults to light', async ({ page }) => {
  await openWithTheme(page, null)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(await token(page, '--background')).toMatch(LIGHT_BACKGROUND)
})

for (const theme of ['dark', 'seasonal-dark']) {
  test(`${theme} applies the dark tokens and dark: utilities`, async ({ page }) => {
    await openWithTheme(page, theme)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    expect(await token(page, '--background')).not.toMatch(LIGHT_BACKGROUND)
    await expect(page.locator('img.object-cover').first()).toHaveCSS('filter', /brightness\(0\.2\)/)
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  })
}

test('an unknown stored theme renders as light', async ({ page }) => {
  await openWithTheme(page, 'system')
  expect(await token(page, '--background')).toMatch(LIGHT_BACKGROUND)
})

test('theme and season attributes cause no hydration errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await openWithTheme(page, 'seasonal-dark')
  await page.waitForLoadState('networkidle')
  expect(errors.filter(e => /hydrat/i.test(e))).toEqual([])
})

test('switching language keeps theme and season, with no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await openWithTheme(page, 'seasonal-dark')
  await page.getByRole('combobox', { name: 'Language' }).click()
  await page.getByRole('option', { name: /Русский/ }).click()
  await expect(page).toHaveURL(/\/ru\/auth\/signin$/)
  await expect(page.locator('html')).toHaveAttribute('data-season', seasonForMonth(new Date().getMonth()))
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'seasonal-dark')
  await page.waitForLoadState('networkidle')
  expect(errors).toEqual([])
})

test('sets data-season from the local date before paint', async ({ page }) => {
  await openWithTheme(page, null)
  await expect(page.locator('html')).toHaveAttribute('data-season', seasonForMonth(new Date().getMonth()))
})
