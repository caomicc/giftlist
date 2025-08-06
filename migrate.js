import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'

if (!process.env.NEON_DATABASE_URL) {
  console.error('❌ NEON_DATABASE_URL environment variable is not set')
  console.log('Make sure your .env.local file contains NEON_DATABASE_URL')
  process.exit(1)
}

console.log('🔗 Database URL:', process.env.NEON_DATABASE_URL.replace(/password:[^@]+@/, 'password:***@'))
const sql = neon(process.env.NEON_DATABASE_URL)

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...')

    // First check what tables exist
    console.log('📋 Checking existing tables...')
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `
    console.log('Existing tables:', tables.map(t => t.table_name))

    // Drop existing tables to recreate with proper foreign keys to users table
    console.log('🧹 Cleaning up existing gift tables...')
    await sql`DROP TABLE IF EXISTS gift_items CASCADE`
    await sql`DROP TABLE IF EXISTS family_members CASCADE`

    // Create gift_items table that references users table
    console.log('📝 Creating gift_items table with user references...')
    await sql`
      CREATE TABLE IF NOT EXISTS gift_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        price TEXT,
        link TEXT,
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        purchased_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create trigger function
    console.log('📝 Creating trigger function...')
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `

    // Create trigger
    console.log('📝 Creating trigger...')
    await sql`DROP TRIGGER IF EXISTS update_gift_items_updated_at ON gift_items`
    await sql`
      CREATE TRIGGER update_gift_items_updated_at
        BEFORE UPDATE ON gift_items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `

    // Create indexes
    console.log('📝 Creating indexes...')
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_items_owner_id ON gift_items(owner_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_items_purchased_by ON gift_items(purchased_by)`
    await sql`CREATE INDEX IF NOT EXISTS idx_gift_items_created_at ON gift_items(created_at DESC)`

    console.log('✅ Tables created successfully')

    // Check tables again
    const tablesAfter = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `
    console.log('Tables after creation:', tablesAfter.map(t => t.table_name))

    // Create some fake users for seeding data
    console.log('🌱 Creating fake users for seed data...')
    const fakeUsers = [
      { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Cammy', email: 'cammy@example.com' },
      { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Nick', email: 'nick@example.com' },
      { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Sasha', email: 'sasha@example.com' },
      { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Masha', email: 'masha@example.com' },
      { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Serg', email: 'serg@example.com' },
    ]

    // Insert fake users (only if they don't exist)
    for (const user of fakeUsers) {
      await sql`
        INSERT INTO users (id, name, email, created_at, updated_at)
        VALUES (${user.id}, ${user.name}, ${user.email}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `
    }

    // Seed gift items with fake user UUIDs
    console.log('🌱 Seeding gift items...')
    await sql`DELETE FROM gift_items`

    await sql`
      INSERT INTO gift_items (name, description, price, owner_id, purchased_by) VALUES
        ('Silk Scarf', 'Elegant silk scarf in blue', '$45', '550e8400-e29b-41d4-a716-446655440001', NULL),
        ('Coffee Table Book', 'Photography book about gardens', '$35', '550e8400-e29b-41d4-a716-446655440001', NULL),
        ('Wireless Headphones', 'Noise-canceling headphones', '$150', '550e8400-e29b-41d4-a716-446655440002', NULL),
        ('Grilling Tools Set', 'Professional BBQ tool set', '$80', '550e8400-e29b-41d4-a716-446655440002', NULL),
        ('Art Supplies Kit', 'Watercolor painting set', '$60', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004'),
        ('Bluetooth Speaker', 'Portable speaker for room', '$40', '550e8400-e29b-41d4-a716-446655440003', NULL),
        ('Gaming Mouse', 'RGB gaming mouse', '$70', '550e8400-e29b-41d4-a716-446655440005', NULL),
        ('Skateboard', 'Complete skateboard setup', '$120', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002')
    `

    console.log('✅ Data seeded successfully')

    // Verify data
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const itemCount = await sql`SELECT COUNT(*) as count FROM gift_items`
    console.log(`👥 Users in system: ${userCount[0].count}`)
    console.log(`🎁 Gift items created: ${itemCount[0].count}`)

    console.log('🎉 Migration completed!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigrations()
