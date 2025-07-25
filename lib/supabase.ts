import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      family_members: {
        Row: {
          id: string
          name: string
          avatar: string
          color: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          avatar: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar?: string
          color?: string
          created_at?: string
        }
      }
      gift_items: {
        Row: {
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
        Insert: {
          id?: string
          name: string
          description?: string | null
          price?: string | null
          link?: string | null
          owner_id: string
          purchased_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: string | null
          link?: string | null
          owner_id?: string
          purchased_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
