import { test, expect, signInAs, expand, myGiftRow, SEED, SEED_GIFTS, type Page } from './fixtures'

// Real database flows (local DB). Serial: the first test archives a shared seed gift.
test.describe.configure({ mode: 'serial' })

const TENT = SEED_GIFTS.twoPersonTent
const SAMS_COMMENT = 'I can chip in $80.'
// ?user_id= is the owner's own query, which includes archived items
const tentCount = async (page: Page) =>
  (await (await page.request.get(`/api/gift-items?user_id=${SEED.alex.id}`)).json()).giftItems
    .find((g: { id: string }) => g.id === TENT.id)?.comment_count

test('the owner reads family comments only once the gift is archived', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await expand(page, "Alex's wishlist")
  expect(Number(await tentCount(page))).toBe(0)
  await page.getByRole('button', { name: TENT.name }).click()
  const drawer = page.getByRole('dialog', { name: TENT.name })
  await expect(drawer.getByText('Family comments stay hidden until you archive this gift.')).toBeVisible()
  await expect(drawer.getByText(SAMS_COMMENT)).toHaveCount(0)
  await page.keyboard.press('Escape')
  await myGiftRow(page, TENT.name).getByRole('button', { name: 'Archive item' }).click()
  try {
    await expect.poll(async () => Number(await tentCount(page))).toBe(1)
    await page.getByRole('button', { name: TENT.name }).click()
    await expect(page.getByRole('dialog', { name: TENT.name }).getByText(SAMS_COMMENT)).toBeVisible()
    await page.keyboard.press('Escape')
  } finally {
    await myGiftRow(page, TENT.name).getByRole('button', { name: 'Unarchive item' }).click()
  }
  await expect.poll(async () => Number(await tentCount(page))).toBe(0) // hidden again once unarchived
})

test('family members are told the owner can’t read comments yet', async ({ page }) => {
  await signInAs(page, SEED.sam.email)
  await page.getByRole('tab', { name: 'Family Lists' }).click()
  await expand(page, `${SEED.alex.name}'s Gift Lists`)
  await page.getByRole('button', { name: TENT.name }).click()
  const drawer = page.getByRole('dialog', { name: TENT.name })
  await expect(drawer.getByText(SAMS_COMMENT)).toBeVisible()
  await expect(drawer.getByText(`${SEED.alex.name} can’t read comments until they archive this gift.`)).toBeVisible()
})
