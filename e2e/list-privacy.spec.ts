import { test, expect, signInAs, SEED } from './fixtures'

const openEditDialog = async (page: import('./fixtures').Page) => {
  await page.getByRole('button', { name: "Edit Alex's wishlist" }).click()
  return page.getByRole('dialog', { name: 'Edit List' })
}

test('a failed privacy save says so and keeps the dialog open', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await page.route('**/api/lists/*/permissions', route =>
    route.request().method() === 'PUT' ? route.fulfill({ status: 500, json: {} }) : route.fallback())
  const dialog = await openEditDialog(page)
  await dialog.getByLabel('Hidden from specific members').check()
  await dialog.getByLabel(SEED.sam.name).check()
  await dialog.getByRole('button', { name: 'Update List' }).click()
  await expect(page.getByText('Couldn’t save who can see this list. Try again.')).toBeVisible()
  await expect(dialog).toBeVisible()
})

test('saving a list confirms it', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  const dialog = await openEditDialog(page)
  await dialog.getByRole('button', { name: 'Update List' }).click()
  await expect(page.getByText('List saved')).toBeVisible()
  await expect(dialog).toBeHidden()
})

test('lists are created and edited where they are shown', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await expect(page.getByRole('button', { name: 'Manage Lists' })).toHaveCount(0)
  await page.getByRole('button', { name: "Edit Alex's wishlist" }).click()
  // Your last list can't be deleted
  await expect(page.getByRole('dialog', { name: 'Edit List' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete list' })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'New list' }).click()
  await expect(page.getByRole('dialog', { name: 'Create New List' })).toBeVisible()
})

test('a list is deleted from its own edit dialog', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  const name = `E2E list ${Date.now()}`
  const res = await page.request.post('/api/lists', { data: { name, is_public: false } })
  expect(res.ok()).toBe(true)
  await page.reload()
  await page.getByRole('button', { name: `Edit ${name}` }).click()
  await page.getByRole('button', { name: 'Delete list' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('List deleted')).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Edit List' })).toBeHidden()
  await expect(page.getByRole('button', { name: `Edit ${name}` })).toHaveCount(0)
})
