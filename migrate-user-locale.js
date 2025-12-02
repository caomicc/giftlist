const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env" });

async function migrateUserLocale() {
  const sql = neon(process.env.NEON_DATABASE_URL);

  console.log("Starting user locale migration...");

  try {
    // Add preferred_locale column if it doesn't exist
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(5) DEFAULT 'en'
    `;

    // Create index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_preferred_locale ON users(preferred_locale)
    `;

    // Update existing users to have default locale
    await sql`
      UPDATE users SET preferred_locale = 'en' WHERE preferred_locale IS NULL
    `;

    console.log("✓ Migration completed successfully!");
    console.log("  - Added preferred_locale column to users table");
    console.log("  - Set default locale to 'en' for all existing users");
  } catch (error) {
    console.error("Migration failed", error);
    process.exit(1);
  }
}

migrateUserLocale();
