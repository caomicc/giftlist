import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

if (!process.env.NEON_DATABASE_URL) {
  console.error('❌ NEON_DATABASE_URL environment variable is not set')
  process.exit(1)
}

const sql = neon(process.env.NEON_DATABASE_URL)

async function updateSchema() {
  try {
    console.log('🚀 Updating database schema...')
    
    // Check the current structure
    console.log('📋 Checking users table structure...')
    const userColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
    `
    console.log('Users columns:', userColumns)
    
    console.log('📋 Checking gift_items table structure...')
    const giftColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'gift_items' AND table_schema = 'public'
    `
    console.log('Gift_items columns:', giftColumns)
    
    // Drop existing foreign key constraints
    console.log('📝 Dropping old foreign key constraints...')
    await sql`
      ALTER TABLE gift_items 
      DROP CONSTRAINT IF EXISTS gift_items_owner_id_fkey,
      DROP CONSTRAINT IF EXISTS gift_items_purchased_by_fkey
    `
    
    // Change owner_id and purchased_by columns to UUID to match users table
    console.log('📝 Changing owner_id and purchased_by to UUID type...')
    await sql`ALTER TABLE gift_items ALTER COLUMN owner_id TYPE UUID USING owner_id::uuid`
    await sql`ALTER TABLE gift_items ALTER COLUMN purchased_by TYPE UUID USING purchased_by::uuid`
    
    // Update the owner_id and purchased_by to reference users table
    console.log('📝 Adding new foreign key constraints to users table...')
    await sql`
      ALTER TABLE gift_items 
      ADD CONSTRAINT gift_items_owner_id_fkey 
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    `
    
    await sql`
      ALTER TABLE gift_items 
      ADD CONSTRAINT gift_items_purchased_by_fkey 
      FOREIGN KEY (purchased_by) REFERENCES users(id) ON DELETE SET NULL
    `
    
    console.log('✅ Schema updated successfully!')
    console.log('ℹ️  Gift items table now links to users instead of family_members')
    
  } catch (error) {
    console.error('❌ Schema update failed:', error)
    process.exit(1)
  }
}

updateSchema()
