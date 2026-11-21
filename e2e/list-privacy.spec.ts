import { test, expect, signInAs, SEED } from './fixtures'

const openEditDialog = async (page: import('./fixtures').Page) => {
  await page.getByRole('button', { name: 'Manage Lists' }).click()
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
