import { test, expect, signInAs, SEED } from './fixtures'

test('the tab survives a reload and can be linked to', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await page.getByRole('tab', { name: /Suggestions/ }).click()
  await expect(page).toHaveURL(/\?tab=suggestions$/)
  await page.reload()
  await expect(page.getByRole('tab', { name: /Suggestions/ })).toHaveAttribute('aria-selected', 'true')
  await page.goto('/en?tab=family-lists')
  await expect(page.getByRole('tab', { name: 'Family Lists' })).toHaveAttribute('aria-selected', 'true')
})

test('an unknown tab falls back to my list', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await page.goto('/en?tab=nope')
  await expect(page.getByRole('tab', { name: 'My Gift List' })).toHaveAttribute('aria-selected', 'true')
})

test('the greeting and tabs don’t repeat themselves', async ({ page }) => {
  await signInAs(page, SEED.jordan.email) // has one pending suggestion
  await expect(page.getByText('Welcome back')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'My Gift Ideas' })).toHaveCount(0)
  await page.getByRole('tab', { name: /Suggestions/ }).click()
  await expect(page.getByText('1', { exact: true })).toHaveCount(2) // tab badge + Incoming badge only
})
