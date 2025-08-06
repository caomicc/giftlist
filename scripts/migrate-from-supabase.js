// Migration script to export data from Supabase and prepare for Neon import
// Run this with: node scripts/migrate-from-supabase.js

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function exportData() {
  try {
    console.log('🔄 Exporting data from Supabase...')

    // Export family members
    const { data: familyMembers, error: familyError } = await supabase
      .from('family_members')
      .select('*')

    if (familyError) throw familyError

    // Export gift items
    const { data: giftItems, error: giftError } = await supabase
      .from('gift_items')
      .select('*')

    if (giftError) throw giftError

    console.log(`📊 Found ${familyMembers?.length || 0} family members`)
    console.log(`🎁 Found ${giftItems?.length || 0} gift items`)

    // Generate SQL for family members
    let familyMembersSql = '-- Migrated family members from Supabase\nDELETE FROM family_members;\n\n'
    if (familyMembers && familyMembers.length > 0) {
      familyMembersSql += 'INSERT INTO family_members (id, name, avatar, color, created_at) VALUES\n'
      const familyValues = familyMembers.map(member =>
        `  ('${member.id}', '${member.name.replace(/'/g, "''")}', '${member.avatar}', '${member.color}', '${member.created_at}')`
      ).join(',\n')
      familyMembersSql += familyValues + '\nON CONFLICT (id) DO UPDATE SET\n  name = EXCLUDED.name,\n  avatar = EXCLUDED.avatar,\n  color = EXCLUDED.color;\n\n'
    }

    // Generate SQL for gift items
    let giftItemsSql = '-- Migrated gift items from Supabase\nDELETE FROM gift_items;\n\n'
    if (giftItems && giftItems.length > 0) {
      giftItemsSql += 'INSERT INTO gift_items (id, name, description, price, link, owner_id, purchased_by, created_at, updated_at) VALUES\n'
      const giftValues = giftItems.map(item => {
        const description = item.description ? `'${item.description.replace(/'/g, "''")}'` : 'NULL'
        const price = item.price ? `'${item.price.replace(/'/g, "''")}'` : 'NULL'
        const link = item.link ? `'${item.link.replace(/'/g, "''")}'` : 'NULL'
        const purchasedBy = item.purchased_by ? `'${item.purchased_by}'` : 'NULL'

        return `  ('${item.id}', '${item.name.replace(/'/g, "''")}', ${description}, ${price}, ${link}, '${item.owner_id}', ${purchasedBy}, '${item.created_at}', '${item.updated_at}')`
      }).join(',\n')
      giftItemsSql += giftValues + '\nON CONFLICT (id) DO UPDATE SET\n  name = EXCLUDED.name,\n  description = EXCLUDED.description,\n  price = EXCLUDED.price,\n  link = EXCLUDED.link,\n  owner_id = EXCLUDED.owner_id,\n  purchased_by = EXCLUDED.purchased_by,\n  updated_at = EXCLUDED.updated_at;\n\n'
    }

    // Write migration files
    const migrationDir = path.join(process.cwd(), 'scripts', 'neon')
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true })
    }

    fs.writeFileSync(
      path.join(migrationDir, '03-migrate-family-members.sql'),
      familyMembersSql
    )

    fs.writeFileSync(
      path.join(migrationDir, '04-migrate-gift-items.sql'),
      giftItemsSql
    )

    // Create combined migration file
    const combinedSql = familyMembersSql + '\n' + giftItemsSql
    fs.writeFileSync(
      path.join(migrationDir, '03-complete-migration.sql'),
      combinedSql
    )

    console.log('✅ Migration files created successfully!')
    console.log('📁 Files created:')
    console.log('  - scripts/neon/03-migrate-family-members.sql')
    console.log('  - scripts/neon/04-migrate-gift-items.sql')
    console.log('  - scripts/neon/03-complete-migration.sql')
    console.log('\n🚀 Next steps:')
    console.log('1. Run the Neon table creation script: scripts/neon/01-create-tables.sql')
    console.log('2. Run the migration script: scripts/neon/03-complete-migration.sql')
    console.log('3. Update your environment variables to use NEON_DATABASE_URL')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

exportData()
