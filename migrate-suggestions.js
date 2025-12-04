// Run the gift suggestions migration
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'

config()

async function runMigration() {
  if (!process.env.NEON_DATABASE_URL) {
    throw new Error('NEON_DATABASE_URL is not set')
  }

  const sql = neon(process.env.NEON_DATABASE_URL)

  try {
    console.log('🚀 Running gift suggestions migration...')

    // 1. Create gift_suggestions table
    console.log('📝 Creating gift_suggestions table...')
    await sql`
      CREATE TABLE IF NOT EXISTS gift_suggestions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        suggested_by_id TEXT NOT NULL,
        target_user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price TEXT,
        link TEXT,
        image_url TEXT,
        is_anonymous BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
        denial_reason TEXT,
        og_title TEXT,
        og_description TEXT,
        og_image TEXT,
        og_site_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // 2. Add suggested_by_id column to gift_items
    console.log('📝 Adding suggested_by_id column to gift_items...')
    await sql`
      ALTER TABLE gift_items
      ADD COLUMN IF NOT EXISTS suggested_by_id TEXT
    `

    // 3. Add is_anonymous_suggestion column to gift_items
    console.log('📝 Adding is_anonymous_suggestion column to gift_items...')
    await sql`
      ALTER TABLE gift_items
      ADD COLUMN IF NOT EXISTS is_anonymous_suggestion BOOLEAN DEFAULT FALSE
    `

    // 4. Create indexes
    console.log('📝 Creating indexes...')
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_suggestions_suggested_by_id ON gift_suggestions(suggested_by_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_suggestions_target_user_id ON gift_suggestions(target_user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_suggestions_status ON gift_suggestions(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_items_suggested_by_id ON gift_items(suggested_by_id)`

    // 5. Try to add foreign key constraints
    console.log('📝 Attempting to add foreign key constraints...')
    try {
      await sql`
        ALTER TABLE gift_suggestions
        ADD CONSTRAINT gift_suggestions_suggested_by_id_fkey
        FOREIGN KEY (suggested_by_id) REFERENCES users(id) ON DELETE CASCADE
      `
      console.log('   ✓ Added suggested_by_id foreign key constraint on gift_suggestions')
    } catch (err) {
      console.log('   ⚠ Could not add suggested_by_id foreign key constraint (app will function without it)')
    }

    try {
      await sql`
        ALTER TABLE gift_suggestions
        ADD CONSTRAINT gift_suggestions_target_user_id_fkey
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
      `
      console.log('   ✓ Added target_user_id foreign key constraint on gift_suggestions')
    } catch (err) {
      console.log('   ⚠ Could not add target_user_id foreign key constraint (app will function without it)')
    }

    try {
      await sql`
        ALTER TABLE gift_items
        ADD CONSTRAINT gift_items_suggested_by_id_fkey
        FOREIGN KEY (suggested_by_id) REFERENCES users(id) ON DELETE SET NULL
      `
      console.log('   ✓ Added suggested_by_id foreign key constraint on gift_items')
    } catch (err) {
      console.log('   ⚠ Could not add gift_items suggested_by_id foreign key constraint (app will function without it)')
    }

    console.log('')
    console.log('✅ Migration completed successfully!')
    console.log('')
    console.log('📝 Changes applied:')
    console.log('   - Created gift_suggestions table')
    console.log('   - Added suggested_by_id column to gift_items')
    console.log('   - Added is_anonymous_suggestion column to gift_items')
    console.log('   - Added indexes for performance')
    console.log('   - Attempted to add foreign key constraints')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
