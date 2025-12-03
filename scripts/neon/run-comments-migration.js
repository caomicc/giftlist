// Migration script for gift_item_comments table
// Run with: node scripts/neon/run-comments-migration.js

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function runMigration() {
  const databaseUrl = process.env.NEON_DATABASE_URL;

  if (!databaseUrl) {
    console.error('NEON_DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  try {
    console.log('Running gift_item_comments migration...');

    // Create the gift_item_comments table
    console.log('Creating gift_item_comments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS gift_item_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gift_item_id UUID NOT NULL REFERENCES gift_items(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_gift_item ON gift_item_comments(gift_item_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_user ON gift_item_comments(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_created_at ON gift_item_comments(created_at DESC)`;

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
