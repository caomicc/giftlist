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
  preferred_locale?: string
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

export type ListPermission = {
  id: string
  list_id: string
  user_id: string
  can_view: boolean
  created_at: string
  updated_at: string
}

export type GiftItem = {
  id: string
  name: string
  description: string | null
  price: string | null
  link: string | null
  image_url: string | null
  owner_id: string
  purchased_by: string | null
  list_id: string
  is_gift_card: boolean
  is_group_gift: boolean
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

export type GiftInterest = {
  id: string
  gift_item_id: string
  user_id: string
  created_at: string
}

export type AmazonProduct = {
  asin: string
  url: string
  title: string | null
  description: string | null
  image_url: string | null
  price: string | null
  currency: string | null
  updated_at: string
}

export type GiftItemComment = {
  id: string
  gift_item_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  // Joined fields
  user_name?: string
}
