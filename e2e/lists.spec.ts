import { test, expect, signInAs, SEED } from './fixtures'

test('a user who already has a list never gets a default list, even when lists load slowly', async ({ page }) => {
  const created: string[] = []
  let releaseLists = () => {}
  const listsHeld = new Promise<void>(resolve => { releaseLists = resolve })
  await page.route('**/api/lists', async route => {
    if (route.request().method() === 'POST') {
      created.push(route.request().postData() ?? '')
      return route.abort() // never let the test create data
    }
    await listsHeld // lists arrive after the gifts
    return route.fallback()
  })
  await signInAs(page, SEED.jordan.email)
  // Gifts have loaded (the add field shows) but lists haven't: no made-up "Unknown List" meanwhile
  await expect(page.getByPlaceholder('Paste a link or type a gift')).toBeVisible()
  await expect(page.getByText('Unknown List')).toHaveCount(0)
  releaseLists()
  await expect(page.getByRole('button', { name: /^Jordan's wishlist/ })).toBeVisible()
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
  expect(JSON.parse(created[0])).toMatchObject({ name: `${SEED.jordan.name}'s list`, description: null })
  await page.waitForTimeout(500)
  expect(created).toHaveLength(1)
})

test('a list’s open/close chevron and edit button line up with its name', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  const trigger = page.getByRole('button', { name: /^Alex's wishlist/ })
  const middle = async (el: import('@playwright/test').Locator) => {
    const box = (await el.boundingBox())!
    return box.y + box.height / 2
  }
  const title = await middle(trigger.locator('h3'))
  expect(Math.abs((await middle(trigger.locator(':scope > svg'))) - title)).toBeLessThan(1)
  expect(Math.abs((await middle(page.getByRole('button', { name: "Edit Alex's wishlist" }).locator('svg'))) - title)).toBeLessThan(1)
})

test('the edit button sits before the chevron, so the whole header opens and closes the list', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  const trigger = page.getByRole('button', { name: /^Alex's wishlist/ })
  const chevron = (await trigger.locator(':scope > svg').boundingBox())!
  const pencil = (await page.getByRole('button', { name: "Edit Alex's wishlist" }).boundingBox())!
  expect(pencil.x + pencil.width).toBeLessThanOrEqual(chevron.x)
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await page.mouse.click(chevron.x + chevron.width / 2, chevron.y + chevron.height / 2)
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
})
