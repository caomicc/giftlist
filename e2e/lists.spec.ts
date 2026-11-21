import { test, expect, signInAs, SEED } from './fixtures'

test('a user who already has a list never gets a default list, even when lists load slowly', async ({ page }) => {
  const created: string[] = []
  await page.route('**/api/lists', async route => {
    if (route.request().method() === 'POST') {
      created.push(route.request().postData() ?? '')
      return route.abort() // never let the test create data
    }
    await new Promise(resolve => setTimeout(resolve, 1500)) // lists arrive after the gifts
    return route.fallback()
  })
  await signInAs(page, SEED.jordan.email)
  await expect(page.getByRole('button', { name: "Jordan's wishlist" })).toBeVisible()
  await expect(page.getByText('Board game: Wingspan', { exact: true })).toBeVisible() // a list that loads late still opens
  await page.waitForTimeout(500) // give any late effect a chance to fire
  expect(created).toEqual([])
})

test('a user with no lists gets exactly one default list', async ({ page }) => {
  const created: string[] = []
  await page.route('**/api/lists', route => {
    if (route.request().method() === 'POST') {
      created.push(route.request().postData() ?? '')
      return route.abort() // never let the test create data
    }
    return route.fulfill({ json: [] })
  })
  await signInAs(page, SEED.jordan.email)
  await expect.poll(() => created.length).toBe(1)
  expect(JSON.parse(created[0])).toMatchObject({ description: 'Default wishlist' })
  await page.waitForTimeout(500)
  expect(created).toHaveLength(1)
})
