import { test, expect, fakeSignIn } from './fixtures'

test.beforeEach(async ({ page }) => fakeSignIn(page))

test('picking a theme applies it, marks it, and survives a reload', async ({ page }) => {
  await page.goto('/en/profile')
  await page.getByRole('button', { name: 'My Profile' }).click()
  await page.getByRole('menuitem', { name: 'Theme' }).click()
  for (const [label, value] of [['Dark', 'dark'], ['Seasonal light', 'seasonal-light'], ['Seasonal dark', 'seasonal-dark'], ['Light', 'light']]) {
    await page.getByRole('menuitemradio', { name: label, exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', value)
    await page.getByRole('button', { name: 'My Profile' }).click()
    await page.getByRole('menuitem', { name: 'Theme' }).click()
    await expect(page.getByRole('menuitemradio', { name: label, exact: true })).toHaveAttribute('aria-checked', 'true')
  }
  await page.getByRole('menuitemradio', { name: 'Seasonal dark', exact: true }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'seasonal-dark')
})

test('theme labels are translated', async ({ page }) => {
  await page.goto('/ru/profile')
  await page.getByRole('button', { name: 'Мой профиль' }).click()
  await page.getByRole('menuitem', { name: 'Тема' }).click()
  for (const label of ['Светлая', 'Тёмная', 'Сезонная светлая', 'Сезонная тёмная']) {
    await expect(page.getByRole('menuitemradio', { name: label, exact: true })).toBeVisible()
  }
})
