import { randomUUID } from 'crypto'
import type { APIRequestContext } from '@playwright/test'
import { test, expect, SEED } from './fixtures'
import { sql, apiAs } from './db'
import { e2eServerEnv } from './local-env'

// Agent tokens, the MCP endpoint and the daily digest. The `request` fixture carries no cookies,
// so calls made with it are authenticated by the bearer token alone.

test.describe.configure({ mode: 'serial' })

/** Creates an agent token the way the profile page does, from a browser (cookie) session. */
async function createToken(userId: string) {
  const browser = await apiAs(userId)
  const res = await browser.post('/api/user/tokens', { data: { name: 'e2e' } })
  expect(res.ok()).toBe(true)
  const { token, id } = await res.json() as { token: string; id: string }
  const revoke = async () => {
    await browser.delete(`/api/user/tokens?id=${id}`)
    await browser.dispose()
  }
  return { token, revoke }
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

async function mcp(request: APIRequestContext, token: string, method: string, params: object = {}) {
  const res = await request.post('/api/mcp', {
    headers: { ...bearer(token), Accept: 'application/json, text/event-stream' },
    data: { jsonrpc: '2.0', id: 1, method, params },
  })
  expect(res.status()).toBe(200)
  return (await res.json()).result
}

/** Calls a tool and returns its parsed JSON, failing the test if the tool reported an error. */
async function tool(request: APIRequestContext, token: string, name: string, args: object = {}) {
  const result = await mcp(request, token, 'tools/call', { name, arguments: args })
  expect(result.isError ?? false, result.content?.[0]?.text).toBe(false)
  return JSON.parse(result.content[0].text)
}

type Gift = { id: string; name: string; claimed_by: string | null }

// Seeded lists in db/seed.sql
const ALEX_LIST = '00000000-0000-4000-8000-000000000101'
const SAM_LIST = '00000000-0000-4000-8000-000000000102' // a surprise list
// What the owner of a surprise list sees instead of who claimed a gift (a null would read as unclaimed)
const HIDDEN = 'hidden: surprise list'

test('an agent token works on the API but can’t change passwords or make more tokens', async ({ request }) => {
  const { token, revoke } = await createToken(SEED.alex.id)
  try {
    expect((await request.get('/api/gift-items', { headers: bearer(token) })).status()).toBe(200)
    expect((await request.post('/api/user/tokens', { headers: bearer(token), data: {} })).status()).toBe(401)
    expect((await request.post('/api/auth/set-password', { headers: bearer(token), data: { password: 'hijacked1' } })).status()).toBe(401)
    expect((await request.post('/api/user/change-password', { headers: bearer(token), data: { newPassword: 'hijacked1' } })).status()).toBe(401)
    expect((await request.post('/api/mcp', { data: {} })).status()).toBe(401)
  } finally {
    await revoke()
  }
  // Revoked tokens stop working
  expect((await request.get('/api/gift-items', { headers: bearer(token) })).status()).toBe(401)
})

test('MCP tools respect surprise lists', async ({ request }) => {
  // Morgan's own surprise list: gifts.spec claims the seeded ones in parallel
  const alex = await createToken(SEED.alex.id)
  const morgan = await createToken(SEED.morgan.id)
  let listId: string | undefined
  try {
    // The handshake a real client (Claude Code, Hermes) does first
    const init = await mcp(request, alex.token, 'initialize', {
      protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'e2e', version: '1' },
    })
    expect(init.serverInfo.name).toBe('meep-giftlist')
    const initialized = await request.post('/api/mcp', {
      headers: { ...bearer(alex.token), Accept: 'application/json, text/event-stream' },
      data: { jsonrpc: '2.0', method: 'notifications/initialized' },
    })
    expect(initialized.status()).toBe(202)

    const { tools } = await mcp(request, alex.token, 'tools/list')
    expect(tools.map((t: { name: string }) => t.name).sort()).toEqual([
      'add_gift', 'add_gifts', 'create_list', 'delete_gift', 'list_gifts', 'list_lists', 'list_people',
      'set_archived', 'set_claimed', 'set_tags', 'update_list', 'whoami',
    ])

    listId = (await tool(request, morgan.token, 'create_list', { name: `E2E surprise ${randomUUID()}`, surprise: true })).id
    const gift = await tool(request, morgan.token, 'add_gift', { name: 'Cast iron pan', list_id: listId })
    expect(gift.claimed_by).toBe(HIDDEN)

    // Alex claims a gift on Morgan's surprise list
    const claimed = await tool(request, alex.token, 'set_claimed', { gift_id: gift.id, claimed: true })
    expect(claimed.claimed_by).toBe(SEED.alex.name)

    const forAlex: Gift[] = await tool(request, alex.token, 'list_gifts', { list_id: listId })
    expect(forAlex.find(g => g.id === gift.id)?.claimed_by).toBe(SEED.alex.name)
    // ...and Morgan can't see whether it's been claimed, nor find it by searching for Alex
    const forMorgan: Gift[] = await tool(request, morgan.token, 'list_gifts', { list_id: listId })
    expect(forMorgan.find(g => g.id === gift.id)).toMatchObject({ claimed_by: HIDDEN })
    // Edits answer with the gift too
    expect(await tool(request, morgan.token, 'set_tags', { gift_id: gift.id, priority: 'high' })).toMatchObject({ claimed_by: HIDDEN })
    expect(await tool(request, morgan.token, 'set_archived', { gift_id: gift.id, archived: false })).toMatchObject({ claimed_by: HIDDEN })
    expect(await tool(request, morgan.token, 'list_gifts', { list_id: listId, query: 'Alex' })).toEqual([])

    // Can't claim your own gift
    const own = await mcp(request, morgan.token, 'tools/call', { name: 'set_claimed', arguments: { gift_id: gift.id, claimed: true } })
    expect(own.isError).toBe(true)
  } finally {
    if (listId) await sql`DELETE FROM lists WHERE id = ${listId}`
    await alex.revoke()
    await morgan.revoke()
  }
})

test('agents archive, restore and delete their own gifts, and only their own', async ({ request }) => {
  // Morgan owns the temporary list: other specs count Alex's lists
  const morgan = await createToken(SEED.morgan.id)
  const jordan = await createToken(SEED.jordan.id)
  const morganApi = await apiAs(SEED.morgan.id)
  const listRes = await morganApi.post('/api/lists', { data: { name: `E2E archive ${randomUUID()}` } })
  expect(listRes.status(), await listRes.text()).toBe(201)
  const listId = (await listRes.json()).id
  const ids = (gifts: Gift[]) => gifts.map(g => g.id)
  try {
    const gift = await tool(request, morgan.token, 'add_gift', { name: 'Archive me', list_id: listId })

    // Someone else's gift: refused, and nothing changes
    for (const [name, args] of [['set_archived', { gift_id: gift.id, archived: true }], ['delete_gift', { gift_id: gift.id }]] as const) {
      const refused = await mcp(request, jordan.token, 'tools/call', { name, arguments: args })
      expect(refused.isError, name).toBe(true)
    }
    expect(ids(await tool(request, jordan.token, 'list_gifts', { list_id: listId }))).toEqual([gift.id]) // neither archived nor deleted

    expect(await tool(request, morgan.token, 'set_archived', { gift_id: gift.id, archived: true })).toMatchObject({ id: gift.id, archived: true })
    expect(ids(await tool(request, morgan.token, 'list_gifts', { list_id: listId }))).not.toContain(gift.id)
    expect(ids(await tool(request, morgan.token, 'list_gifts', { list_id: listId, archived: true }))).toEqual([gift.id])
    // Others never see archived gifts
    expect(ids(await tool(request, jordan.token, 'list_gifts', { list_id: listId, archived: true }))).toEqual([])

    await tool(request, morgan.token, 'set_archived', { gift_id: gift.id, archived: false })
    expect(ids(await tool(request, jordan.token, 'list_gifts', { list_id: listId }))).toEqual([gift.id])

    expect(await tool(request, morgan.token, 'delete_gift', { gift_id: gift.id })).toMatchObject({ deleted: gift.id })
    expect(ids(await tool(request, morgan.token, 'list_gifts', { list_id: listId }))).toEqual([])
  } finally {
    await sql`DELETE FROM lists WHERE id = ${listId}` // the API won't delete a list that still has gifts
    await morganApi.dispose()
    await morgan.revoke()
    await jordan.revoke()
  }
})

test('agents can ask who they are and find lists by owner name', async ({ request }) => {
  const alex = await createToken(SEED.alex.id)
  try {
    expect(await tool(request, alex.token, 'whoami')).toEqual({ id: SEED.alex.id, name: SEED.alex.name, email: SEED.alex.email })

    const sams = await tool(request, alex.token, 'list_lists', { owner: 'sam' })
    expect(sams).toContainEqual(expect.objectContaining({ id: SAM_LIST, owner: SEED.sam.name, surprise: true, items: 2 }))
    expect(await tool(request, alex.token, 'list_lists', { owner: 'me' })).toContainEqual(expect.objectContaining({ id: ALEX_LIST, owner: SEED.alex.name }))

    const unknown = await mcp(request, alex.token, 'tools/call', { name: 'list_lists', arguments: { owner: 'nobody' } })
    expect(unknown.isError).toBe(true)
  } finally {
    await alex.revoke()
  }
})

test('agents create and update lists without dropping Keep Surprise', async ({ request }) => {
  const morgan = await createToken(SEED.morgan.id)
  const jordan = await createToken(SEED.jordan.id)
  let listId: string | undefined
  try {
    const created = await tool(request, morgan.token, 'create_list', { name: `E2E surprise ${randomUUID()}`, description: 'Birthday', surprise: true })
    listId = created.id
    expect(created).toMatchObject({ surprise: true, description: 'Birthday', owner: SEED.morgan.name })

    const gift = await tool(request, morgan.token, 'add_gift', { name: 'Surprise me', list_id: listId })
    await tool(request, jordan.token, 'set_claimed', { gift_id: gift.id, claimed: true })
    const claimedBy = async () => (await tool(request, morgan.token, 'list_gifts', { list_id: listId }))[0].claimed_by

    // A rename alone keeps it a surprise (the API makes a list public when is_public is left out)
    const renamed = await tool(request, morgan.token, 'update_list', { list_id: listId, name: `E2E renamed ${randomUUID()}` })
    expect(renamed).toMatchObject({ surprise: true, description: 'Birthday' })
    expect(await claimedBy()).toBe(HIDDEN)

    const notYours = await mcp(request, jordan.token, 'tools/call', { name: 'update_list', arguments: { list_id: listId, surprise: false } })
    expect(notYours.isError).toBe(true)
    expect(await claimedBy()).toBe(HIDDEN)

    // Turning the surprise off is the owner's call, as on the website, and shows what's been claimed
    expect(await tool(request, morgan.token, 'update_list', { list_id: listId, surprise: false })).toMatchObject({ surprise: false })
    expect(await claimedBy()).toBe(SEED.jordan.name)
  } finally {
    if (listId) await sql`DELETE FROM lists WHERE id = ${listId}`
    await morgan.revoke()
    await jordan.revoke()
  }
})

test('add_gift takes a picture, tags and an idempotency key; tags change later', async ({ request }) => {
  const morgan = await createToken(SEED.morgan.id)
  const jordan = await createToken(SEED.jordan.id)
  const morganApi = await apiAs(SEED.morgan.id)
  const listRes = await morganApi.post('/api/lists', { data: { name: `E2E tags ${randomUUID()}`, is_public: false } })
  expect(listRes.status(), await listRes.text()).toBe(201)
  const listId = (await listRes.json()).id
  try {
    const key = randomUUID()
    const args = { name: 'Retry me', list_id: listId, image_url: 'https://example.com/pic.jpg', category: 'Kitchen', priority: 'high', idempotency_key: key }
    const first = await tool(request, morgan.token, 'add_gift', args)
    expect(first).toMatchObject({ image: 'https://example.com/pic.jpg', category: 'Kitchen', priority: 'high' })

    // A retry returns the same gift instead of a second one
    expect((await tool(request, morgan.token, 'add_gift', args)).id).toBe(first.id)
    expect(await sql`SELECT 1 FROM gift_items WHERE list_id = ${listId}`).toHaveLength(1)

    // ...and doesn't tell the owner of a surprise list that it's been claimed since
    await tool(request, jordan.token, 'set_claimed', { gift_id: first.id, claimed: true })
    const replay = await morganApi.post('/api/gift-items', { data: { owner_id: SEED.morgan.id, list_id: listId, name: 'Retry me', idempotency_key: key } })
    expect((await replay.json()).giftItem).toMatchObject({ id: first.id, purchased_by: null })

    expect(await tool(request, morgan.token, 'set_tags', { gift_id: first.id, priority: 'low', category: null })).toMatchObject({ priority: 'low', category: null })
    const notYours = await mcp(request, jordan.token, 'tools/call', { name: 'set_tags', arguments: { gift_id: first.id, priority: 'high' } })
    expect(notYours.isError).toBe(true)

    // Saving the gift from the website's edit form (which sends the gift's fields, never its tags) keeps them
    expect((await morganApi.put('/api/gift-items', { data: { id: first.id, name: 'Edited', list_id: listId } })).ok()).toBe(true)
    const [row] = await sql`SELECT name, priority FROM gift_items WHERE id = ${first.id}`
    expect(row).toEqual({ name: 'Edited', priority: 'low' })
  } finally {
    await sql`DELETE FROM lists WHERE id = ${listId}`
    await morganApi.dispose()
    await morgan.revoke()
    await jordan.revoke()
  }
})

test('agents add gifts in bulk, retry safely, and search', async ({ request }) => {
  const morgan = await createToken(SEED.morgan.id)
  const jordan = await createToken(SEED.jordan.id)
  const morganApi = await apiAs(SEED.morgan.id)
  const listRes = await morganApi.post('/api/lists', { data: { name: `E2E bulk ${randomUUID()}` } })
  expect(listRes.status(), await listRes.text()).toBe(201)
  const listId = (await listRes.json()).id
  try {
    const items = [
      { name: 'Blue ceramic mug', list_id: listId, idempotency_key: randomUUID() },
      { list_id: listId }, // nothing to add
      { name: 'Wool scarf', description: 'Blue, long', list_id: listId, idempotency_key: randomUUID() },
    ]
    const results = await tool(request, morgan.token, 'add_gifts', { items })
    expect(results.map((r: { name?: string; error?: string }) => r.error ? 'error' : r.name)).toEqual(['Blue ceramic mug', 'error', 'Wool scarf'])

    const retry = await tool(request, morgan.token, 'add_gifts', { items })
    expect(retry[0].id).toBe(results[0].id)
    expect(await sql`SELECT 1 FROM gift_items WHERE list_id = ${listId}`).toHaveLength(2)

    // Every word has to appear, in any case, in the name or description
    const found: Gift[] = await tool(request, jordan.token, 'list_gifts', { list_id: listId, query: 'BLUE wool' })
    expect(found.map(g => g.name)).toEqual(['Wool scarf'])
  } finally {
    await sql`DELETE FROM lists WHERE id = ${listId}`
    await morganApi.dispose()
    await morgan.revoke()
    await jordan.revoke()
  }
})

test('gifts on a list hidden from someone stay out of their MCP results and digest', async ({ request }) => {
  // Morgan owns the temporary list: other specs count Alex's lists
  const morgan = await createToken(SEED.morgan.id)
  const sam = await createToken(SEED.sam.id)
  const jordan = await createToken(SEED.jordan.id)

  const morganApi = await apiAs(SEED.morgan.id)
  const listRes = await morganApi.post('/api/lists', { data: { name: `E2E hidden ${Date.now()}`, hidden_from: [SEED.sam.id] } })
  expect(listRes.ok()).toBe(true)
  const list = await listRes.json()
  const giftName = `E2E secret gift ${Date.now()}`
  let giftId: string | undefined
  try {
    // Only your own lists take gifts
    const notMine = await mcp(request, morgan.token, 'tools/call', { name: 'add_gift', arguments: { name: giftName, list_id: '00000000-0000-4000-8000-000000000102' } })
    expect(notMine.isError).toBe(true)

    const added = await tool(request, morgan.token, 'add_gift', { name: giftName, price: '12.50', list_id: list.id })
    giftId = added.id
    expect(added).toMatchObject({ name: giftName, owner: SEED.morgan.name, list: list.name })

    const since = new Date(Date.now() - 60_000).toISOString()
    const forJordan: Gift[] = await tool(request, jordan.token, 'list_gifts', { since })
    expect(forJordan.map(g => g.name)).toContain(giftName)
    const forSam: Gift[] = await tool(request, sam.token, 'list_gifts', { since })
    expect(forSam.map(g => g.name)).not.toContain(giftName)
    // ...nor among Morgan's lists
    const listIds = async (token: string) => (await tool(request, token, 'list_lists', { owner: 'morgan' }) as { id: string }[]).map(l => l.id)
    expect(await listIds(jordan.token)).toContain(list.id)
    expect(await listIds(sam.token)).not.toContain(list.id)

    // Sam can't claim it by id either
    const claim = await mcp(request, sam.token, 'tools/call', { name: 'set_claimed', arguments: { gift_id: giftId, claimed: true } })
    expect(claim.isError).toBe(true)

    // Daily digest: Jordan hears about it; Sam and Morgan (the owner) don't, nor Riley (can see it, not opted in)
    expect((await request.get('/api/cron/digest')).status()).toBe(401)
    const digest = await request.get('/api/cron/digest', { headers: bearer(e2eServerEnv.CRON_SECRET) })
    expect(digest.ok()).toBe(true)
    const { sent } = await digest.json() as { sent: Record<string, string[]> }
    expect(sent[SEED.jordan.email]).toContain(giftName)
    expect(sent[SEED.sam.email] ?? []).not.toContain(giftName)
    expect(sent[SEED.morgan.email] ?? []).not.toContain(giftName)
    expect(sent[SEED.riley.email]).toBeUndefined()
  } finally {
    if (giftId) await morganApi.delete(`/api/gift-items?id=${giftId}`)
    await morganApi.delete(`/api/lists/${list.id}`)
    await morganApi.dispose()
    for (const t of [morgan, sam, jordan]) await t.revoke()
  }
})
