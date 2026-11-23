import { randomUUID } from 'crypto'
import type { APIRequestContext } from '@playwright/test'
import { test, expect, SEED } from './fixtures'
import { sql, apiAs } from './db'

// Server-side access rules, checked through the API (the UI hides these paths, the API must refuse them).

test('a magic-link user can set a first password, but not replace one', async () => {
  const { id, email } = SEED.morgan
  const api = await apiAs(id)
  try {
    expect((await api.post('/api/auth/set-password', { data: { password: 'first-pass1' } })).status()).toBe(200)
    expect((await api.post('/api/auth/signin-password', { data: { email, password: 'first-pass1' } })).status()).toBe(200)

    // A second call would let anyone holding a session take over the account
    expect((await api.post('/api/auth/set-password', { data: { password: 'hijacked-1' } })).status()).toBe(409)
    expect((await api.post('/api/auth/signin-password', { data: { email, password: 'first-pass1' } })).status()).toBe(200)
  } finally {
    await api.dispose()
    await sql`UPDATE users SET password_hash = NULL WHERE id = ${id}` // back to magic-link only
  }
})

test('the owner of a surprise list can’t learn how many of their gifts were bought', async () => {
  const wool = '00000000-0000-4000-8000-000000000202' // Sam's surprise list, not used by other specs
  const jordan = await apiAs(SEED.jordan.id)
  const sam = await apiAs(SEED.sam.id)
  try {
    expect((await jordan.put('/api/gift-items', { data: { id: wool, purchased_by: SEED.jordan.id } })).ok()).toBe(true)
    const lists = await (await sam.get('/api/lists')).json()
    expect(lists).toHaveLength(1)
    expect(lists[0]).not.toHaveProperty('purchased_count')
    // Nor when: the "Edited" time the drawer shows must not move on a claim
    const { giftItems } = await (await sam.get('/api/gift-items')).json()
    expect(giftItems.find((g: { id: string }) => g.id === wool).edited_at).toBeNull()
  } finally {
    await jordan.put('/api/gift-items', { data: { id: wool, purchased_by: null } })
    await jordan.dispose()
    await sam.dispose()
  }
})

test('the owner of a surprise list can’t see who is going in on a group gift', async () => {
  const morgan = await apiAs(SEED.morgan.id)
  const jordan = await apiAs(SEED.jordan.id)
  const listRes = await morgan.post('/api/lists', { data: { name: `E2E surprise ${randomUUID()}`, is_public: false } })
  expect(listRes.status(), await listRes.text()).toBe(201)
  const listId = (await listRes.json()).id
  try {
    const add = await morgan.post('/api/gift-items', { data: { owner_id: SEED.morgan.id, list_id: listId, name: 'Surprise group gift', is_group_gift: true } })
    const giftId = (await add.json()).giftItem.id
    expect((await jordan.post('/api/gift-interest', { data: { gift_item_id: giftId, user_id: SEED.jordan.id } })).ok()).toBe(true)

    const forJordan = await (await jordan.get(`/api/gift-interest?gift_item_id=${giftId}`)).json()
    expect(forJordan.interests.map((i: { user_id: string }) => i.user_id)).toEqual([SEED.jordan.id])
    const forMorgan = await (await morgan.get(`/api/gift-interest?gift_item_id=${giftId}`)).json()
    expect(forMorgan.interests).toEqual([])
  } finally {
    await sql`DELETE FROM gift_interest WHERE gift_item_id IN (SELECT id::text FROM gift_items WHERE list_id = ${listId})`
    await sql`DELETE FROM lists WHERE id = ${listId}`
    await morgan.dispose()
    await jordan.dispose()
  }
})

test.describe('gifts on a list hidden from you', () => {
  let owner: APIRequestContext // Morgan: other specs count Alex's lists
  let sam: APIRequestContext
  let listId: string
  const gifts: Record<'regular' | 'giftCard' | 'groupGift', string> = { regular: '', giftCard: '', groupGift: '' }

  test.beforeAll(async () => {
    owner = await apiAs(SEED.morgan.id)
    sam = await apiAs(SEED.sam.id)
    // Every worker runs this; list names must be unique per owner
    const res = await owner.post('/api/lists', { data: { name: `E2E hidden from Sam ${randomUUID()}`, hidden_from: [SEED.sam.id] } })
    expect(res.status(), await res.text()).toBe(201)
    listId = (await res.json()).id
    const add = async (data: object) =>
      (await (await owner.post('/api/gift-items', { data: { owner_id: SEED.morgan.id, list_id: listId, ...data } })).json()).giftItem.id
    gifts.regular = await add({ name: 'Hidden regular gift' })
    gifts.giftCard = await add({ name: 'Hidden gift card', is_gift_card: true, gift_card_target_amount: 50 })
    gifts.groupGift = await add({ name: 'Hidden group gift', is_group_gift: true })
  })

  test.afterAll(async () => {
    // Contributions and interest have no foreign key to cascade from; the list cascades to its gifts
    const ids = Object.values(gifts).filter(Boolean)
    if (ids.length) {
      await sql`DELETE FROM gift_card_purchases WHERE gift_item_id = ANY(${ids})`
      await sql`DELETE FROM gift_interest WHERE gift_item_id = ANY(${ids})`
    }
    if (listId) await sql`DELETE FROM lists WHERE id = ${listId}`
    await owner.dispose()
    await sam.dispose()
  })

  test('can’t be claimed', async () => {
    const res = await sam.put('/api/gift-items', { data: { id: gifts.regular, purchased_by: SEED.sam.id } })
    expect(res.status()).toBe(404)
    const [row] = await sql`SELECT purchased_by FROM gift_items WHERE id = ${gifts.regular}`
    expect(row.purchased_by).toBeNull()
  })

  test('gift card contributions can’t be read or added', async () => {
    expect((await sam.get(`/api/gift-card-purchases?gift_item_id=${gifts.giftCard}`)).status()).toBe(404)
    expect((await sam.post('/api/gift-card-purchases', { data: { gift_item_id: gifts.giftCard, amount: 10 } })).status()).toBe(404)
    const rows = await sql`SELECT 1 FROM gift_card_purchases WHERE gift_item_id = ${gifts.giftCard}`
    expect(rows).toHaveLength(0)
  })

  test('interest in a group gift can’t be read or added', async () => {
    expect((await sam.get(`/api/gift-interest?gift_item_id=${gifts.groupGift}`)).status()).toBe(404)
    expect((await sam.post('/api/gift-interest', { data: { gift_item_id: gifts.groupGift, user_id: SEED.sam.id } })).status()).toBe(404)
    const rows = await sql`SELECT 1 FROM gift_interest WHERE gift_item_id = ${gifts.groupGift}`
    expect(rows).toHaveLength(0)
  })

  test('is still open to everyone else', async () => {
    const jordan = await apiAs(SEED.jordan.id)
    try {
      expect((await jordan.get(`/api/gift-card-purchases?gift_item_id=${gifts.giftCard}`)).status()).toBe(200)
      expect((await jordan.get(`/api/gift-interest?gift_item_id=${gifts.groupGift}`)).status()).toBe(200)
      const claim = await jordan.put('/api/gift-items', { data: { id: gifts.regular, purchased_by: SEED.jordan.id } })
      expect(claim.status()).toBe(200)
      await jordan.put('/api/gift-items', { data: { id: gifts.regular, purchased_by: null } })
    } finally {
      await jordan.dispose()
    }
  })
})
