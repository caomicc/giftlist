import { test, expect, signInAs, SEED } from './fixtures'

test('a pending suggestion shows a formatted price and no repeated status', async ({ page }) => {
  await signInAs(page, SEED.jordan.email)
  await page.getByRole('tab', { name: /Suggestions/ }).click()
  await expect(page.getByText('$199.00')).toBeVisible()
  await expect(page.getByText('Pending', { exact: true })).toHaveCount(0)
})
