import { test, expect, fakeSignIn } from './fixtures'

test.beforeEach(async ({ page }) => {
  await fakeSignIn(page, { id: 'e2e-user', email: 'e2e@example.com', name: 'Old Name' })
  await page.goto('/en/profile')
  await expect(page.getByLabel('Display Name')).toHaveValue('Old Name')
})

test('updating the display name saves the trimmed name', async ({ page }) => {
  let body: unknown
  await page.route('**/api/user/profile', route => {
    if (route.request().method() !== 'PUT') return route.fallback()
    body = route.request().postDataJSON()
    return route.fulfill({ json: { id: 'e2e-user', email: 'e2e@example.com', name: 'New Name' } })
  })
  await page.getByLabel('Display Name').fill('  New Name  ')
  await page.getByLabel('Display Name').press('Enter')
  await expect(page.getByText('Profile updated successfully!')).toBeVisible()
  expect(body).toEqual({ name: 'New Name' })
})

test('mismatched new passwords keep the change button disabled', async ({ page }) => {
  await page.getByRole('tab', { name: 'Password' }).click()
  await page.getByLabel('Current Password').fill('current-secret')
  await page.getByLabel('New Password').fill('secret123')
  await page.getByLabel('Confirm Password').fill('secret124')
  await expect(page.getByRole('button', { name: 'Change Password' })).toBeDisabled()
  await page.getByLabel('Confirm Password').fill('secret123')
  await expect(page.getByRole('button', { name: 'Change Password' })).toBeEnabled()
})

test('a too-short new password is rejected before anything is sent', async ({ page }) => {
  let sent = false
  await page.route('**/api/user/change-password', route => { sent = true; return route.abort() })
  await page.getByRole('tab', { name: 'Password' }).click()
  await page.getByLabel('Current Password').fill('current-secret')
  await page.getByLabel('New Password').fill('abc')
  await page.getByLabel('Confirm Password').fill('abc')
  await page.getByRole('button', { name: 'Change Password' }).click()
  await expect(page.getByText('New password must be at least 6 characters long')).toBeVisible()
  expect(sent).toBe(false)
})
