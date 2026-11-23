import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'
import { sendNewItemsDigest, type DigestItem } from '@/lib/email'
import { isValidLocale, defaultLocale } from '@/lib/i18n'

/**
 * Daily email of new gifts, run by Vercel Cron (vercel.json), which sends
 * `Authorization: Bearer $CRON_SECRET`.
 *
 * ponytail: a fixed 24-hour window. Cron timing drifts a little, so an item added near the
 * boundary can show up twice or not at all. Upgrade path: a users.digest_sent_at column.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Each recipient gets gifts other people added, on lists that recipient can see.
  // The visibility rule is copied from app/api/gift-items/route.ts (GET); keep the two in step.
  // e2e/agent-access.spec.ts checks that a hidden list stays out of the digest.
  const rows = await sql`
    SELECT
      u.id AS recipient_id,
      u.email,
      u.name AS recipient_name,
      u.preferred_locale,
      gi.name,
      gi.price,
      gi.currency,
      u_owner.name AS owner_name
    FROM users u
    JOIN gift_items gi ON gi.owner_id <> u.id
    JOIN lists l ON gi.list_id = l.id
    LEFT JOIN users u_owner ON gi.owner_id = u_owner.id
    LEFT JOIN list_permissions lp ON l.id = lp.list_id AND lp.user_id = u.id
    WHERE gi.created_at > NOW() - INTERVAL '24 hours'
    AND gi.archived = FALSE
    AND (
      l.owner_id = u.id
      OR (lp.can_view = TRUE)
      OR (
        lp.user_id IS NULL AND (
          NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id)
          OR NOT EXISTS (SELECT 1 FROM list_permissions lp2 WHERE lp2.list_id = l.id AND lp2.can_view = TRUE)
        )
      )
    )
    ORDER BY u.id, u_owner.name, gi.created_at
  `

  type Digest = { email: string; name: string | null; locale: string; items: DigestItem[] }
  const byRecipient = new Map<string, Digest>()
  for (const r of rows) {
    const entry: Digest = byRecipient.get(r.recipient_id) ??
      { email: r.email, name: r.recipient_name, locale: r.preferred_locale, items: [] }
    entry.items.push({ name: r.name, owner_name: r.owner_name, price: r.price, currency: r.currency })
    byRecipient.set(r.recipient_id, entry)
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const sent: Record<string, string[]> = {}
  for (const { email, name, locale, items } of byRecipient.values()) {
    const lang = isValidLocale(locale) ? locale : defaultLocale
    await sendNewItemsDigest(email, name, items, `${baseUrl}/${lang}`, lang)
    sent[email] = items.map(i => i.name)
  }

  return NextResponse.json({ sent })
}
