import { test, expect, signInAs, expand, myGiftRow, SEED, SEED_GIFTS, type Page } from './fixtures'

// Real database flows (local DB). Serial: claim tests share a seeded gift.
test.describe.configure({ mode: 'serial' })

const uniqueName = () => `E2E ${test.info().testId} ${Date.now()}`
const ALEX_LIST = "Alex's wishlist"

async function addGift(page: Page, name: string) {
  await page.getByPlaceholder('Paste a link or type a gift').fill(name)
  await page.getByRole('button', { name: 'Add Gift Idea' }).click()
  await expand(page, ALEX_LIST)
  await expect(page.getByText(name, { exact: true })).toBeVisible()
}

async function deleteGift(page: Page, name: string) {
  await myGiftRow(page, name).getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText(name, { exact: true })).toHaveCount(0)
}

test.describe('my list', () => {
  test.beforeEach(async ({ page }) => signInAs(page, SEED.alex.email))

  test('adds a gift', async ({ page }) => {
    const name = uniqueName()
    await addGift(page, name)
    await page.reload()
    await expand(page, ALEX_LIST)
    await expect(page.getByText(name, { exact: true })).toBeVisible()
    await deleteGift(page, name)
  })

  test('edits a gift', async ({ page }) => {
    const name = uniqueName()
    const renamed = `${name} (edited)`
    await addGift(page, name)
    await myGiftRow(page, name).getByRole('button', { name: 'Edit' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit Gift Item' })
    await dialog.getByLabel('Gift').fill(renamed)
    await dialog.getByRole('button', { name: 'Update Gift Item' }).click()
    await expect(page.getByText(renamed, { exact: true })).toBeVisible()
    await expect(page.getByText(name, { exact: true })).toHaveCount(0)
    await deleteGift(page, renamed)
  })

  test('my lists are open when the page loads', async ({ page }) => {
    await expect(page.getByText(SEED_GIFTS.chefsKnife.name, { exact: true })).toBeVisible()
  })

  test('adding a gift says which list it went to', async ({ page }) => {
    const name = uniqueName()
    await page.getByPlaceholder('Paste a link or type a gift').fill(name)
    await page.getByRole('button', { name: 'Add Gift Idea' }).click()
    await expect(page.getByText(`Added to ${ALEX_LIST}`)).toBeVisible()
    await deleteGift(page, name)
  })

  test('archiving can be undone', async ({ page }) => {
    const knife = SEED_GIFTS.chefsKnife.name
    await myGiftRow(page, knife).getByRole('button', { name: 'Archive item' }).click()
    await expect(page.getByText(`Archived "${knife}"`)).toBeVisible()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByText(`Restored "${knife}"`)).toBeVisible()
    await page.reload() // the undo must reach the server, not just the screen
    await expect(myGiftRow(page, knife).getByRole('button', { name: 'Archive item' })).toBeVisible()
    await expect(myGiftRow(page, knife).getByRole('button', { name: 'Unarchive item' })).toHaveCount(0)
  })

  test('description and image wait behind “More details”', async ({ page }) => {
    await page.getByPlaceholder('Paste a link or type a gift').fill('Anything')
    await expect(page.getByLabel(/Image URL/)).toBeHidden()
    await page.getByText('More details').click()
    await expect(page.getByLabel(/Image URL/)).toBeVisible()
    await expect(page.getByLabel(/Description/)).toBeVisible()
  })

  test('deletes a gift', async ({ page }) => {
    const name = uniqueName()
    await addGift(page, name)
    await deleteGift(page, name)
    await page.reload()
    await expand(page, ALEX_LIST)
    await expect(page.getByText(SEED_GIFTS.chefsKnife.name, { exact: true })).toBeVisible()
    await expect(page.getByText(name, { exact: true })).toHaveCount(0)
  })
})

test.describe('claiming', () => {
  const skillet = SEED_GIFTS.castIronSkillet.name

  async function openSkillet(page: Page) {
    await page.getByRole('tab', { name: 'Family Lists' }).click()
    await expand(page, `${SEED.sam.name}'s Gift Lists`)
    await page.getByText(skillet, { exact: true }).click()
  }

  test('one click on a family member shows their gifts', async ({ page }) => {
    await signInAs(page, SEED.riley.email)
    await page.getByRole('tab', { name: 'Family Lists' }).click()
    await page.getByRole('button', { name: `${SEED.sam.name}'s Gift Lists` }).click()
    await expect(page.getByText(skillet, { exact: true })).toBeVisible()
  })

  test('claims and unclaims another member’s gift', async ({ page }) => {
    await signInAs(page, SEED.riley.email)
    await openSkillet(page)
    await page.getByRole('button', { name: 'I’ll get this' }).click()
    await expect(page.getByRole('button', { name: 'You’re getting this' })).toBeVisible()
    try {
      await page.reload()
      await openSkillet(page)
      await expect(page.getByRole('button', { name: 'You’re getting this' })).toBeVisible()
    } finally {
      await page.getByRole('button', { name: 'You’re getting this' }).click()
      await expect(page.getByRole('button', { name: 'I’ll get this' })).toBeVisible()
    }
  })

  test('releasing a claim can be undone', async ({ page }) => {
    await signInAs(page, SEED.riley.email)
    await openSkillet(page)
    await page.getByRole('button', { name: 'I’ll get this' }).click()
    await page.getByRole('button', { name: 'You’re getting this' }).click()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByRole('button', { name: 'You’re getting this' })).toBeVisible()
    await page.getByRole('button', { name: 'You’re getting this' }).click() // cleanup
    await expect(page.getByRole('button', { name: 'I’ll get this' })).toBeVisible()
  })

  test('undoing a release after someone else claimed it says so', async ({ page }) => {
    await signInAs(page, SEED.riley.email)
    await openSkillet(page)
    await page.getByRole('button', { name: 'I’ll get this' }).click()
    await page.getByRole('button', { name: 'You’re getting this' }).click()
    await expect(page.getByRole('button', { name: 'I’ll get this' })).toBeVisible()
    await page.route('**/api/gift-items*', route =>
      route.request().method() === 'PUT' ? route.fulfill({ status: 403, json: {} }) : route.fallback())
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByText('Someone else already claimed this')).toBeVisible()
  })

  test('claimed gifts move below the open ones', async ({ page }) => {
    await signInAs(page, SEED.riley.email)
    await page.getByRole('tab', { name: 'Family Lists' }).click()
    await page.getByRole('button', { name: `${SEED.sam.name}'s Gift Lists` }).click()
    const titles = () => page.getByRole('region', { name: "Sam's wishlist" }).locator('h3 button').allTextContents()
    const [first, second] = await titles()
    await page.getByRole('button', { name: first, exact: true }).locator('xpath=ancestor::div[contains(@class,"py-3")][1]')
      .getByRole('button', { name: 'I’ll get this' }).click()
    try {
      await expect.poll(titles).toEqual([second, first])
    } finally {
      await page.getByRole('button', { name: 'You’re getting this' }).click()
      await expect(page.getByRole('button', { name: 'You’re getting this' })).toHaveCount(0)
    }
  })

  test('another member sees who claimed it; the owner of a surprise list sees nothing', async ({ page, browser }) => {
    await signInAs(page, SEED.riley.email)
    await openSkillet(page)
    await page.getByRole('button', { name: 'I’ll get this' }).click()
    await expect(page.getByRole('button', { name: 'You’re getting this' })).toBeVisible()
    // Separate contexts: each member needs their own session cookie.
    const others = [await browser.newContext(), await browser.newContext()]
    try {
      const jordan = await others[0].newPage()
      await signInAs(jordan, SEED.jordan.email)
      await openSkillet(jordan)
      await expect(jordan.getByText(`Claimed by ${SEED.riley.name}`).first()).toBeVisible()

      const sam = await others[1].newPage() // Sam's list keeps purchases hidden from Sam (is_public = false)
      await signInAs(sam, SEED.sam.email)
      await expect(sam.getByText(skillet, { exact: true })).toBeVisible()
      await expect(sam.getByText('Purchased', { exact: true })).toHaveCount(0)
      await expect(sam.getByText(SEED.riley.name)).toHaveCount(0)
    } finally {
      await Promise.all(others.map(context => context.close()))
      await page.getByRole('button', { name: 'You’re getting this' }).click()
      await expect(page.getByRole('button', { name: 'I’ll get this' })).toBeVisible()
    }
  })
})

test('a group gift offers “I’m in” and “I’ll organize it”', async ({ page }) => {
  await signInAs(page, SEED.riley.email)
  await page.getByRole('tab', { name: 'Family Lists' }).click()
  await page.getByRole('button', { name: `${SEED.alex.name}'s Gift Lists` }).click()
  await page.getByRole('button', { name: SEED_GIFTS.twoPersonTent.name }).click()
  const drawer = page.getByRole('dialog', { name: SEED_GIFTS.twoPersonTent.name })
  await expect(drawer.getByRole('button', { name: 'I’m in' })).toBeVisible()
  await expect(drawer.getByRole('button', { name: 'I’ll organize it' })).toBeVisible()
  await expect(drawer.getByText('2 people are in')).toBeVisible()
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('a claimed gift shows its full name and one status', async ({ page }) => {
    await signInAs(page, SEED.alex.email)
    await page.getByRole('tab', { name: 'Family Lists' }).click()
    await page.getByRole('button', { name: `${SEED.jordan.name}'s Gift Lists` }).click()
    const title = page.getByRole('button', { name: 'Board game: Wingspan' })
    await expect(title).toBeVisible()
    expect(await title.evaluate(el => el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight)).toBe(true)
    await expect(page.getByText(`Claimed by ${SEED.riley.name}`)).toBeVisible()
    await expect(page.getByText('Purchased', { exact: true })).toHaveCount(0)
  })

  test('the gift drawer opens from the bottom on phones, without repeating the claim', async ({ page }) => {
    await signInAs(page, SEED.alex.email)
    await page.getByRole('tab', { name: 'Family Lists' }).click()
    await page.getByRole('button', { name: `${SEED.jordan.name}'s Gift Lists` }).click()
    await page.getByRole('button', { name: 'Board game: Wingspan' }).click()
    const drawer = page.getByRole('dialog', { name: 'Board game: Wingspan' })
    await expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'bottom')
    await expect(drawer.getByText(`Purchased by ${SEED.riley.name}`)).toHaveCount(0)
    await expect(drawer.getByText(`Claimed by ${SEED.riley.name}`)).toBeVisible()
  })
})
