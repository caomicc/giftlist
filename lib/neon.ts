import { neon } from '@neondatabase/serverless'

function createSQL() {
  if (!process.env.NEON_DATABASE_URL) {
    throw new Error('NEON_DATABASE_URL is not set')
  }
  return neon(process.env.NEON_DATABASE_URL)
}

// Export sql connection - will only be used server-side
export const sql = createSQL()

export type User = {
  id: string
  name: string
  email: string
  created_at: string
}

export type List = {
  id: string
  name: string
  description: string | null
  owner_id: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export type GiftItem = {
  id: string
  name: string
  description: string | null
  price: string | null
  link: string | null
  owner_id: string
  purchased_by: string | null
  list_id: string
  is_gift_card: boolean
  gift_card_target_amount: number | null
  gift_card_total_purchased: number
  og_title: string | null
  og_description: string | null
  og_image: string | null
  og_site_name: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export type GiftCardPurchase = {
  id: string
  gift_item_id: string
  purchaser_id: string
  amount: number
  created_at: string
}
