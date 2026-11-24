import { NextRequest } from 'next/server'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { getApiUser, type User } from '@/lib/auth'
import { unauthorized } from '@/lib/gift-privacy'
import { isCurrency, parsePrice } from '@/lib/currency'
import * as giftItems from '../gift-items/route'
import * as lists from '../lists/route'
import * as listById from '../lists/[id]/route'
import * as familyMembers from '../family-members/route'
import * as ogData from '../og-data/route'

/*
 * MCP server for agents (Claude Code, Hermes), authenticated with an agent token from the
 * profile page sent as `Authorization: Bearer <token>`. Stateless: one server per request.
 *
 * ponytail: tools call the existing route handlers in-process. Their getApiUser() reads this
 * request's bearer header, so every permission check and the surprise-list scrub apply unchanged.
 * Upgrade path if this gets awkward: move the SQL into lib/ functions that both call.
 *
 * Surprise lists: gift data only ever comes from routes that scrub purchases for the list's owner,
 * the list tools never count purchases, and update_list always resends is_public, so a partial
 * update can't switch a surprise off.
 */

// Bulk adds fetch link previews one by one. With idempotency keys a timed-out batch is safe to retry.
export const maxDuration = 60

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

/** /api/lists/[id] handlers take the id as a route param. */
const withListId = (id: string, handler: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>) =>
  (req: NextRequest) => handler(req, { params: Promise.resolve({ id }) })

const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] })

/** What an agent needs from a gift row; the rest is UI plumbing. */
const giftSummary = (g: Row) => ({
  id: g.id,
  name: g.name,
  description: g.description,
  price: g.price,
  currency: g.currency,
  link: g.link,
  image: g.og_image || g.image_url || null, // the website shows og_image first too
  owner_id: g.owner_id,
  owner: g.owner_name,
  list_id: g.list_id,
  list: g.list_name,
  claimed_by: g.purchaser_name ?? null,
  is_gift_card: g.is_gift_card,
  ...(g.is_gift_card ? { gift_card_target: g.gift_card_target_amount, gift_card_contributed: g.gift_card_total_purchased } : {}),
  is_group_gift: g.is_group_gift,
  category: g.category ?? null,
  priority: g.priority ?? null,
  archived: g.archived,
  added_at: g.created_at,
  edited_at: g.edited_at ?? null,
})

/** Active gifts, or with archived = true your archived ones (the API never returns anyone else's). */
async function visibleGifts(archived = false): Promise<Row[]> {
  const { giftItems: rows } = await call(giftItems.GET, '/api/gift-items')
  return (rows as Row[]).filter(g => Boolean(g.archived) === archived)
}

const myLists = (): Promise<Row[]> => call(lists.GET, '/api/lists')

const httpUrl = z.url({ protocol: /^https?$/ })
const PRIORITIES = ['high', 'medium', 'low'] as const

const giftFields = {
  name: z.string().optional(),
  link: httpUrl.optional(),
  image_url: httpUrl.optional().describe('Picture to show; replaces the one found at the link'),
  price: z.string().optional().describe('Amount only, e.g. "24.99"'),
  currency: z.string().optional().describe('ISO code, e.g. USD, EUR, RUB'),
  description: z.string().optional(),
  category: z.string().max(50).optional().describe('Free text, e.g. "Kitchen" or "Books"'),
  priority: z.enum(PRIORITIES).optional(),
  list_id: z.string().optional().describe("Required if you have more than one list (list_lists with owner 'me')"),
  idempotency_key: z.string().min(1).max(200).optional().describe(
    'Any unique string, e.g. a UUID. Sending the same key again returns the gift already added, so a retry after a timeout makes no duplicate.'),
}
const giftInput = z.object(giftFields)

function buildServer(user: User) {
  const server = new McpServer({ name: 'meep-giftlist', version: '1.0.0' })

  /** One of your own lists, as the list tools return it. */
  const listSummary = (l: Row) => ({
    id: l.id,
    name: l.name,
    description: l.description ?? null,
    owner_id: user.id,
    owner: user.name,
    surprise: l.is_public === false,
    ...(l.item_count === undefined ? {} : { items: Number(l.item_count) }),
  })

  /** A person's id from 'me', their id, or part of their name. */
  async function personId(who: string): Promise<string> {
    if (who === 'me') return user.id
    const { users } = await call(familyMembers.GET, '/api/family-members')
    const people = (users as Row[]).map(u => ({ id: String(u.id), name: String(u.name ?? '') }))
    const matches = people.filter(p => p.id === who || p.name.toLowerCase().includes(who.toLowerCase()))
    if (matches.length === 1) return matches[0].id
    throw new Error(`${matches.length ? `More than one person matches "${who}"` : `No one matches "${who}"`}; pass an id. People: ${JSON.stringify(people)}`)
  }

  async function addGift(item: z.infer<typeof giftInput>, mine: Row[]) {
    const { name, link, image_url, price, currency, description, category, priority, list_id, idempotency_key } = item
    if (!name?.trim() && !link) throw new Error('Give a name, a link, or both')
    if (currency && !isCurrency(currency)) throw new Error(`Unsupported currency: ${currency}`)

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
      // The website shows og_image ahead of image_url, so an explicit picture replaces the scraped one
      image_url: image_url || og.image || undefined,
      og_image: image_url ? undefined : og.image,
      owner_id: user.id,
      list_id: list.id,
      og_title: og.title,
      og_description: og.description,
      og_site_name: og.siteName,
      category,
      priority,
      idempotency_key,
    })
    // A repeated key returns the gift it made first, which may be on another list
    const onList = mine.find(l => l.id === giftItem.list_id) ?? list
    return giftSummary({ ...giftItem, owner_name: user.name, list_name: onList.name })
  }

  server.registerTool('whoami', {
    description: 'Who this token acts as.',
  }, async () => json({ id: user.id, name: user.name, email: user.email }))

  server.registerTool('list_people', {
    description: 'Family members on the gift list, with the ids other tools take.',
  }, async () => {
    const { users } = await call(familyMembers.GET, '/api/family-members')
    return json({ you: user.id, people: (users as Row[]).map(u => ({ id: u.id, name: u.name })) })
  })

  server.registerTool('list_lists', {
    description:
      "Wishlists you can see, yours included, with how many gifts are on each. A 'surprise' list hides " +
      "from its owner what others have bought on it. Other people's lists show only once they have gifts.",
    inputSchema: {
      owner: z.string().optional().describe("Only this person's lists: part of their name (e.g. Sam), an id from list_people, or 'me'"),
    },
  }, async ({ owner }) => {
    const ownerId = owner ? await personId(owner) : null
    const result: Row[] = ownerId && ownerId !== user.id ? [] : (await myLists()).map(listSummary)
    if (ownerId !== user.id) {
      // ponytail: other people's lists are read off the gifts you can see, which is where the
      // visibility rules live, so their empty lists don't show. Add a lists query if that matters.
      const others = new Map<unknown, Row & { items: number }>()
      for (const g of await visibleGifts()) {
        if (g.list_owner_id === user.id || (ownerId && g.list_owner_id !== ownerId)) continue
        const l = others.get(g.list_id) ??
          { id: g.list_id, name: g.list_name, owner_id: g.list_owner_id, owner: g.owner_name, surprise: g.is_public === false, items: 0 }
        l.items++
        others.set(g.list_id, l)
      }
      result.push(...others.values())
    }
    return json(result)
  })

  server.registerTool('create_list', {
    description: "Start a new wishlist of your own. surprise: true is the website's \"Keep Surprise\": you won't see what others buy from it.",
    inputSchema: {
      name: z.string().min(1),
      description: z.string().optional(),
      surprise: z.boolean().optional(),
    },
  }, async ({ name, description, surprise }) => {
    const list: Row = await call(lists.POST, '/api/lists', { name, description, is_public: !surprise })
    return json(listSummary({ ...list, item_count: 0 }))
  })

  server.registerTool('update_list', {
    description:
      'Rename one of your lists, change its description, or turn surprise on or off; anything left out stays as it is. ' +
      'Turning surprise off shows you everything already bought from that list, so only do it when asked to.',
    inputSchema: {
      list_id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().nullable().optional().describe('null clears it'),
      surprise: z.boolean().optional(),
    },
  }, async ({ list_id, name, description, surprise }) => {
    const path = `/api/lists/${encodeURIComponent(list_id)}`
    const current: Row = await call(withListId(list_id, listById.GET), path)
    // The API resets whatever is left out (a missing is_public makes the list public, ending the
    // surprise), so send every field
    const updated: Row = await call(withListId(list_id, listById.PUT), path, {
      name: name ?? current.name,
      description: description === undefined ? current.description : description,
      is_public: surprise === undefined ? current.is_public : !surprise,
    }, 'PUT')
    return json(listSummary(updated))
  })

  server.registerTool('list_gifts', {
    description:
      'Gifts on every list you can see, newest first: yours and other family members\'. ' +
      'claimed_by is who said they will buy it (always null on your own surprise lists).',
    inputSchema: {
      owner_id: z.string().optional().describe('Only gifts belonging to this person (id from list_people)'),
      list_id: z.string().optional().describe('Only gifts on this list'),
      since: z.string().optional().describe('Only gifts added at or after this ISO date/time, e.g. 2026-11-20'),
      query: z.string().optional().describe('Words to look for in the name, description or category; every word has to appear'),
      archived: z.boolean().optional().describe('true: your archived gifts instead (nobody else sees them)'),
    },
  }, async ({ owner_id, list_id, since, query, archived }) => {
    const sinceMs = since ? Date.parse(since) : null
    if (sinceMs !== null && Number.isNaN(sinceMs)) throw new Error(`Not a date: ${since}`)
    const words = query?.toLowerCase().split(/\s+/).filter(Boolean) ?? []
    // The gift's own text only: who bought it never enters the search
    const text = (g: Row) => [g.name, g.description, g.og_title, g.og_description, g.category].join(' ').toLowerCase()
    const gifts = (await visibleGifts(archived)).filter(g =>
      (!owner_id || g.owner_id === owner_id) &&
      (!list_id || g.list_id === list_id) &&
      (sinceMs === null || Date.parse(String(g.created_at)) >= sinceMs) &&
      words.every(w => text(g).includes(w)))
    return json(gifts.map(giftSummary))
  })

  server.registerTool('add_gift', {
    description:
      'Add a gift to one of your own lists. Give a link, a name, or both; with a link the title, ' +
      'image and price are filled in from the page when possible.',
    inputSchema: giftFields,
  }, async item => json(await addGift(item, await myLists())))

  server.registerTool('add_gifts', {
    description:
      "Add up to 25 gifts at once, each like add_gift. A bad item doesn't stop the rest: each result is the " +
      'added gift or { error }. Give every item an idempotency_key so the whole batch can be retried safely.',
    inputSchema: {
      items: z.array(giftInput).min(1).max(25),
    },
  }, async ({ items }) => {
    const mine = await myLists()
    const results = []
    // ponytail: one at a time, since each link can hit the paid product API. Parallelize if batches get slow.
    for (const item of items) {
      results.push(await addGift(item, mine).catch((e: Error) => ({ error: e.message, name: item.name ?? item.link ?? null })))
    }
    return json(results)
  })

  server.registerTool('set_tags', {
    description: 'Set the category and/or priority of one of your gifts. null clears one; anything left out stays.',
    inputSchema: {
      gift_id: z.string(),
      category: z.string().max(50).nullable().optional(),
      priority: z.enum(PRIORITIES).nullable().optional(),
    },
  }, async ({ gift_id, category, priority }) => {
    if (category === undefined && priority === undefined) throw new Error('Give a category, a priority, or both')
    const { giftItem } = await call(giftItems.PUT, '/api/gift-items', { id: gift_id, category, priority }, 'PUT')
    return json(giftSummary({ ...giftItem, owner_name: user.name }))
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

  server.registerTool('set_archived', {
    description:
      'Archive one of your own gifts (archived: true) to take it off your list without deleting it. ' +
      'Nobody else sees it; list_gifts with archived: true still finds it, and archived: false puts it back.',
    inputSchema: {
      gift_id: z.string(),
      archived: z.boolean(),
    },
  }, async ({ gift_id, archived }) => {
    const { giftItem } = await call(giftItems.PUT, '/api/gift-items', { id: gift_id, archived }, 'PUT')
    return json(giftSummary({ ...giftItem, owner_name: user.name }))
  })

  server.registerTool('delete_gift', {
    description: "Permanently delete one of your own gifts. Can't be undone; set_archived is the reversible option.",
    inputSchema: {
      gift_id: z.string(),
    },
  }, async ({ gift_id }) => {
    await call(giftItems.DELETE, `/api/gift-items?id=${encodeURIComponent(gift_id)}`, undefined, 'DELETE')
    return json({ deleted: gift_id })
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
