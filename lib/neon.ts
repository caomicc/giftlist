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

export type GiftItem = {
  id: string
  name: string
  description: string | null
  price: string | null
  link: string | null
  owner_id: string
  purchased_by: string | null
  created_at: string
  updated_at: string
}
