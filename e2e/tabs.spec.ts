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
