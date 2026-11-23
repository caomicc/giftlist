import { NextRequest } from 'next/server'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { getApiUser, type User } from '@/lib/auth'
import { unauthorized } from '@/lib/gift-privacy'
import { isCurrency, parsePrice } from '@/lib/currency'
import * as giftItems from '../gift-items/route'
import * as lists from '../lists/route'
import * as familyMembers from '../family-members/route'
import * as ogData from '../og-data/route'

/*
 * MCP server for agents (Claude Code, Hermes), authenticated with an agent token from the
 * profile page sent as `Authorization: Bearer <token>`. Stateless: one server per request.
 *
 * ponytail: tools call the existing route handlers in-process. Their getApiUser() reads this
 * request's bearer header, so every permission check and the surprise-list scrub apply unchanged.
 * Upgrade path if this gets awkward: move the SQL into lib/ functions that both call.
 */

type Row = Record<string, unknown>

async function call(
  handler: (req: NextRequest) => Promise<Response>,
  path: string,
  body?: unknown,
  method = body === undefined ? 'GET' : 'POST'
) {
  const init = body === undefined
    ? { method }
    : { method, body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }
  const res = await handler(new NextRequest(`http://internal${path}`, init))
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] })

/** What an agent needs from a gift row; the rest is UI plumbing. */
const giftSummary = (g: Row) => ({
  id: g.id,
  name: g.name,
  description: g.description,
  price: g.price,
  currency: g.currency,
  link: g.link,
  owner_id: g.owner_id,
  owner: g.owner_name,
  list_id: g.list_id,
  list: g.list_name,
  claimed_by: g.purchaser_name ?? null,
  is_gift_card: g.is_gift_card,
  ...(g.is_gift_card ? { gift_card_target: g.gift_card_target_amount, gift_card_contributed: g.gift_card_total_purchased } : {}),
  is_group_gift: g.is_group_gift,
  added_at: g.created_at,
})

async function visibleGifts(): Promise<Row[]> {
  const { giftItems: rows } = await call(giftItems.GET, '/api/gift-items')
  return (rows as Row[]).filter(g => !g.archived)
}

function buildServer(user: User) {
  const server = new McpServer({ name: 'meep-giftlist', version: '1.0.0' })

  server.registerTool('list_people', {
    description: 'Family members on the gift list, with the ids other tools take.',
  }, async () => {
    const { users } = await call(familyMembers.GET, '/api/family-members')
    return json({ you: user.id, people: (users as Row[]).map(u => ({ id: u.id, name: u.name })) })
  })

  server.registerTool('list_my_lists', {
    description: "Your own wishlists. A 'surprise' list hides from you what others have bought on it.",
  }, async () => {
    const mine: Row[] = await call(lists.GET, '/api/lists')
    return json(mine.map(l => ({ id: l.id, name: l.name, description: l.description, surprise: l.is_public === false, items: Number(l.item_count) })))
  })

  server.registerTool('list_gifts', {
    description:
      'Gifts on every list you can see, newest first: yours and other family members\'. ' +
      'claimed_by is who said they will buy it (always null on your own surprise lists).',
    inputSchema: {
      owner_id: z.string().optional().describe('Only gifts belonging to this person (id from list_people)'),
      list_id: z.string().optional().describe('Only gifts on this list'),
      since: z.string().optional().describe('Only gifts added at or after this ISO date/time, e.g. 2026-11-20'),
    },
  }, async ({ owner_id, list_id, since }) => {
    const sinceMs = since ? Date.parse(since) : null
    if (sinceMs !== null && Number.isNaN(sinceMs)) throw new Error(`Not a date: ${since}`)
    const gifts = (await visibleGifts()).filter(g =>
      (!owner_id || g.owner_id === owner_id) &&
      (!list_id || g.list_id === list_id) &&
      (sinceMs === null || Date.parse(String(g.created_at)) >= sinceMs))
    return json(gifts.map(giftSummary))
  })

  server.registerTool('add_gift', {
    description:
      'Add a gift to one of your own lists. Give a link, a name, or both; with a link the title, ' +
      'image and price are filled in from the page when possible.',
    inputSchema: {
      name: z.string().optional(),
      link: z.url().optional(),
      price: z.string().optional().describe('Amount only, e.g. "24.99"'),
      currency: z.string().optional().describe('ISO code, e.g. USD, EUR, RUB'),
      description: z.string().optional(),
      list_id: z.string().optional().describe('Required if you have more than one list (see list_my_lists)'),
    },
  }, async ({ name, link, price, currency, description, list_id }) => {
    if (!name?.trim() && !link) throw new Error('Give a name, a link, or both')
    if (currency && !isCurrency(currency)) throw new Error(`Unsupported currency: ${currency}`)

    const mine: Row[] = await call(lists.GET, '/api/lists')
    const list = list_id ? mine.find(l => l.id === list_id) : mine.length === 1 ? mine[0] : undefined
    if (!list) {
      const yours = JSON.stringify(mine.map(l => ({ id: l.id, name: l.name })))
      throw new Error(list_id ? `Not one of your lists: ${list_id}. Your lists: ${yours}` : `You have ${mine.length} lists, so pass list_id. Your lists: ${yours}`)
    }

    // Same link preview the add form uses; a failed preview just means fewer details
    const og: Row = link ? (await call(ogData.POST, '/api/og-data', { url: link }).catch(() => null))?.ogData ?? {} : {}
    const ogPrice = typeof og.price === 'string' ? parsePrice(og.price) : null
    const ogCurrency = (og.currency as string | null) ?? ogPrice?.currency

    const { giftItem } = await call(giftItems.POST, '/api/gift-items', {
      name: name?.trim() || og.title || link,
      description: description || undefined,
      price: price || ogPrice?.amount || undefined,
      currency: currency || (isCurrency(ogCurrency) ? ogCurrency : undefined),
      link: link || undefined,
      image_url: og.image || undefined,
      owner_id: user.id,
      list_id: list.id,
      og_title: og.title,
      og_description: og.description,
      og_image: og.image,
      og_site_name: og.siteName,
    })
    return json(giftSummary({ ...giftItem, owner_name: user.name, list_name: list.name }))
  })

  server.registerTool('set_claimed', {
    description:
      "Say you'll buy someone's gift (claimed: true), or take that back (claimed: false). " +
      'Not for your own gifts or gift cards, and only the person who claimed a gift can unclaim it.',
    inputSchema: {
      gift_id: z.string(),
      claimed: z.boolean(),
    },
  }, async ({ gift_id, claimed }) => {
    // Look the gift up first so agents get a clear reason (gift card, your own gift) instead of a bare 403
    const gift = (await visibleGifts()).find(g => g.id === gift_id)
    if (!gift) throw new Error('No gift with that id on a list you can see')
    if (gift.owner_id === user.id) throw new Error("That's your own gift")
    if (gift.is_gift_card) throw new Error('Gift cards take contributions, not claims; use the website for those')
    const { giftItem } = await call(giftItems.PUT, '/api/gift-items', { id: gift_id, purchased_by: claimed ? user.id : null }, 'PUT')
    return json(giftSummary({ ...gift, ...giftItem, purchaser_name: claimed ? user.name : null }))
  })

  return server
}

export async function POST(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return unauthorized()

  const server = buildServer(user)
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  await server.connect(transport)
  try {
    return await transport.handleRequest(request)
  } finally {
    await server.close()
  }
}
