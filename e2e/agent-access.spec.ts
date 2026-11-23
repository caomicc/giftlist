import type { APIRequestContext } from '@playwright/test'
import { test, expect, SEED, SEED_GIFTS } from './fixtures'
import { apiAs } from './db'
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
  const alex = await createToken(SEED.alex.id)
  const sam = await createToken(SEED.sam.id)
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
    expect(tools.map((t: { name: string }) => t.name).sort()).toEqual(['add_gift', 'list_gifts', 'list_my_lists', 'list_people', 'set_claimed'])

    // Alex claims a gift on Sam's surprise list
    const claimed = await tool(request, alex.token, 'set_claimed', { gift_id: SEED_GIFTS.castIronSkillet.id, claimed: true })
    expect(claimed.claimed_by).toBe(SEED.alex.name)

    const forAlex: Gift[] = await tool(request, alex.token, 'list_gifts', { owner_id: SEED.sam.id })
    expect(forAlex.find(g => g.id === SEED_GIFTS.castIronSkillet.id)?.claimed_by).toBe(SEED.alex.name)
    // ...and Sam can't see that it's been claimed
    const forSam: Gift[] = await tool(request, sam.token, 'list_gifts', { owner_id: SEED.sam.id })
    expect(forSam.find(g => g.id === SEED_GIFTS.castIronSkillet.id)).toMatchObject({ claimed_by: null })

    // Can't claim your own gift
    const own = await mcp(request, sam.token, 'tools/call', { name: 'set_claimed', arguments: { gift_id: SEED_GIFTS.castIronSkillet.id, claimed: true } })
    expect(own.isError).toBe(true)
  } finally {
    await tool(request, alex.token, 'set_claimed', { gift_id: SEED_GIFTS.castIronSkillet.id, claimed: false })
    await alex.revoke()
    await sam.revoke()
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

    // Sam can't claim it by id either
    const claim = await mcp(request, sam.token, 'tools/call', { name: 'set_claimed', arguments: { gift_id: giftId, claimed: true } })
    expect(claim.isError).toBe(true)

    // Daily digest: Jordan hears about it; Sam and Morgan (the owner) don't
    expect((await request.get('/api/cron/digest')).status()).toBe(401)
    const digest = await request.get('/api/cron/digest', { headers: bearer(e2eServerEnv.CRON_SECRET) })
    expect(digest.ok()).toBe(true)
    const { sent } = await digest.json() as { sent: Record<string, string[]> }
    expect(sent[SEED.jordan.email]).toContain(giftName)
    expect(sent[SEED.sam.email] ?? []).not.toContain(giftName)
    expect(sent[SEED.morgan.email] ?? []).not.toContain(giftName)
  } finally {
    if (giftId) await morganApi.delete(`/api/gift-items?id=${giftId}`)
    await morganApi.delete(`/api/lists/${list.id}`)
    await morganApi.dispose()
    for (const t of [morgan, sam, jordan]) await t.revoke()
  }
})
