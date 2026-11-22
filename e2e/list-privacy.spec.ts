import { test, expect, signInAs, SEED } from './fixtures'

// Serial: one test adds (then deletes) a second list for Alex, which changes what the others see
test.describe.configure({ mode: 'serial' })

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
  // Dismissing the toast must not dismiss the dialog (and lose what was typed)
  await page.getByRole('button', { name: 'Close toast' }).click()
  await expect(page.getByText('Couldn’t save who can see this list. Try again.')).toBeHidden()
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

test('if a new list’s privacy and its cleanup both fail, the user is told it’s visible', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  const name = `E2E rollback ${Date.now()}`
  await page.route('**/api/lists/*/permissions', route =>
    route.request().method() === 'PUT' ? route.fulfill({ status: 500, json: {} }) : route.fallback())
  await page.route('**/api/lists/*', route =>
    route.request().method() === 'DELETE' ? route.fulfill({ status: 500, json: {} }) : route.fallback())
  try {
    await page.getByRole('button', { name: 'New list' }).click()
    const dialog = page.getByRole('dialog', { name: 'Create New List' })
    await dialog.getByLabel('List name').fill(name)
    await dialog.getByLabel('Hidden from specific members').check()
    await dialog.getByLabel(SEED.sam.name).check()
    await dialog.getByRole('button', { name: 'Create List' }).click()
    await expect(page.getByText('List created, but its privacy didn’t save: everyone can see it. Edit it to try again.')).toBeVisible()
    await expect(dialog).toBeHidden() // no retry that would make a duplicate
    await expect(page.getByRole('button', { name: `Edit ${name}` })).toBeVisible()
  } finally {
    await page.unrouteAll()
    const lists: { id: string; name: string }[] = await (await page.request.get('/api/lists')).json()
    for (const l of lists.filter(l => l.name === name)) await page.request.delete(`/api/lists/${l.id}`)
  }
})

// Nobody ticked would save no rules, and a list with no rules is visible to everyone
test('a new list visible only to specific members needs at least one of them', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await page.getByRole('button', { name: 'New list' }).click()
  const dialog = page.getByRole('dialog', { name: 'Create New List' })
  await dialog.getByLabel('List name').fill('E2E never saved')
  await dialog.getByLabel('Visible only to specific members').check()
  await expect(dialog.getByText('Pick at least one person who can see this list.')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Create List' })).toBeDisabled()
  await dialog.getByLabel(SEED.sam.name).check()
  await expect(dialog.getByText('Pick at least one person who can see this list.')).toBeHidden()
  await expect(dialog.getByRole('button', { name: 'Create List' })).toBeEnabled()
})

test('editing a list to be visible only to specific members needs at least one of them', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  const dialog = await openEditDialog(page)
  await expect(dialog.getByRole('button', { name: 'Update List' })).toBeEnabled() // permissions loaded
  await dialog.getByLabel('Visible only to specific members').check()
  await expect(dialog.getByText('Pick at least one person who can see this list.')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Update List' })).toBeDisabled()
  await dialog.getByLabel(SEED.sam.name).check()
  await expect(dialog.getByRole('button', { name: 'Update List' })).toBeEnabled()
})
