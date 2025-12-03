/**
 * Migration script to clean up list permissions from old storage format to new format
 * 
 * OLD FORMAT: Store can_view for ALL users (mix of true/false)
 * NEW FORMAT: Only store exceptions
 *   - "visible to specific": only store can_view=true
 *   - "hidden from specific": only store can_view=false
 *   - "visible to all": no permissions
 */

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.NEON_DATABASE_URL)

async function cleanPermissions() {
  console.log('Starting permissions cleanup...\n')

  // Get all lists with permissions
  const listsWithPermissions = await sql`
    SELECT DISTINCT list_id 
    FROM list_permissions
  `

  for (const { list_id } of listsWithPermissions) {
    // Get all permissions for this list
    const permissions = await sql`
      SELECT id, user_id, can_view
      FROM list_permissions
      WHERE list_id = ${list_id}
    `

    const approvals = permissions.filter(p => p.can_view)
    const denials = permissions.filter(p => !p.can_view)

    console.log(`List ${list_id}:`)
    console.log(`  - ${approvals.length} approvals (can_view=true)`)
    console.log(`  - ${denials.length} denials (can_view=false)`)

    // Check if this list has mixed permissions (old format)
    if (approvals.length > 0 && denials.length > 0) {
      console.log(`  ⚠️  MIXED PERMISSIONS - needs cleanup`)

      // Determine the intent based on which is more common
      if (approvals.length > denials.length) {
        // More approvals = "visible to specific" mode
        // Delete all denials, keep approvals
        console.log(`  → Converting to "visible to specific" (keeping ${approvals.length} approvals)`)
        await sql`
          DELETE FROM list_permissions
          WHERE list_id = ${list_id} AND can_view = FALSE
        `
      } else {
        // More denials (or equal) = "hidden from specific" mode
        // Delete all approvals, keep denials
        console.log(`  → Converting to "hidden from specific" (keeping ${denials.length} denials)`)
        await sql`
          DELETE FROM list_permissions
          WHERE list_id = ${list_id} AND can_view = TRUE
        `
      }
      console.log(`  ✓ Cleaned up\n`)
    } else if (approvals.length === 0 && denials.length === 0) {
      console.log(`  ℹ️  No permissions (visible to all)\n`)
    } else if (approvals.length > 0) {
      console.log(`  ✓ Already clean - "visible to specific" mode\n`)
    } else {
      console.log(`  ✓ Already clean - "hidden from specific" mode\n`)
    }
  }

  console.log('Migration complete!')
}

cleanPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
