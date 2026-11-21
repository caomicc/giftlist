import { test, expect, signInAs, expand, myGiftRow, SEED } from './fixtures'

// Real database flows (local DB). Serial: tests add and remove gifts on Alex's list.
test.describe.configure({ mode: 'serial' })

const ALEX_LIST_ID = '00000000-0000-4000-8000-000000000101'

test('the server rejects an unknown currency', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  const res = await page.request.post('/api/gift-items', { data: {
    name: 'Bad currency', price: '10', currency: 'bad', owner_id: SEED.alex.id, list_id: ALEX_LIST_ID } })
  expect(res.status()).toBe(400)
})

test('a euro item shows in euros', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  const res = await page.request.post('/api/gift-items', { data: {
    name: 'Euro item', price: '12', currency: 'EUR', owner_id: SEED.alex.id, list_id: ALEX_LIST_ID } })
  const { giftItem: item } = await res.json()
  try {
    expect(item.currency).toBe('EUR')
    await page.reload()
    await expand(page, "Alex's wishlist")
    await expect(myGiftRow(page, 'Euro item').getByText('€12.00')).toBeVisible()
  } finally {
    await page.request.delete(`/api/gift-items?id=${item.id}`)
  }
})
