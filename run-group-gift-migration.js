// Run the group gift interest migration
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'

config()

async function runMigration() {
  if (!process.env.NEON_DATABASE_URL) {
    throw new Error('NEON_DATABASE_URL is not set')
  }

  const sql = neon(process.env.NEON_DATABASE_URL)

  try {
    console.log('🚀 Running group gift interest migration...')

    // Execute the migration step by step
    
    // 1. Add is_group_gift column
    console.log('📝 Adding is_group_gift column to gift_items...')
    await sql`
      ALTER TABLE gift_items
      ADD COLUMN IF NOT EXISTS is_group_gift BOOLEAN DEFAULT FALSE
    `
    
    // 2. Create gift_interest table
    console.log('📝 Creating gift_interest table...')
    await sql`
      CREATE TABLE IF NOT EXISTS gift_interest (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        gift_item_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(gift_item_id, user_id)
      )
    `
    
    // 3. Create indexes
    console.log('📝 Creating indexes...')
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_interest_gift_item_id ON gift_interest(gift_item_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_interest_user_id ON gift_interest(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_items_is_group_gift ON gift_items(is_group_gift)`
    
    // 4. Try to add foreign key constraints
    console.log('📝 Attempting to add foreign key constraints...')
    try {
      await sql`
        ALTER TABLE gift_interest
        ADD CONSTRAINT gift_interest_gift_item_id_fkey
        FOREIGN KEY (gift_item_id) REFERENCES gift_items(id) ON DELETE CASCADE
      `
      console.log('   ✓ Added gift_item_id foreign key constraint')
    } catch (err) {
      console.log('   ⚠ Could not add gift_item_id foreign key constraint (app will function without it)')
    }
    
    try {
      await sql`
        ALTER TABLE gift_interest
        ADD CONSTRAINT gift_interest_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `
      console.log('   ✓ Added user_id foreign key constraint')
    } catch (err) {
      console.log('   ⚠ Could not add user_id foreign key constraint (app will function without it)')
    }

    console.log('')
    console.log('✅ Migration completed successfully!')
    console.log('')
    console.log('📝 Changes applied:')
    console.log('   - Added is_group_gift column to gift_items table')
    console.log('   - Created gift_interest table to track user interest in group gifts')
    console.log('   - Added indexes for performance')
    console.log('   - Attempted to add foreign key constraints')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
