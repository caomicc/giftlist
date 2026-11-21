import { test, expect, signInAs, SEED } from './fixtures'

test('a seeded user signs in with a password and sees the family', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await expect(page.getByRole('button', { name: 'My Profile' })).toBeVisible()
  await page.getByRole('tab', { name: 'Family Lists' }).click()
  await expect(page.getByText(SEED.sam.name).first()).toBeVisible()
})
