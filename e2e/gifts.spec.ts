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
