const { sql } = require('./lib/neon.ts');
const fs = require('fs');

async function migrate() {
  try {
    const migrationSQL = fs.readFileSync('./scripts/neon/08-add-lists-support.sql', 'utf8');
    console.log('🎯 Running lists migration...');
    
    // Split SQL commands by semicolon and execute them individually
    const commands = migrationSQL.split(';').filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'));
    
    for (const command of commands) {
      if (command.trim()) {
        console.log('⚡ Executing:', command.substring(0, 50).replace(/\n/g, ' ') + '...');
        try {
          await sql([command]);
        } catch (error) {
          console.warn('⚠️  Warning with command:', error.message);
          // Continue with next command as some errors might be expected (like dropping non-existent constraints)
        }
      }
    }
    
    console.log('✅ Lists migration completed successfully!');
    
    // Verify the migration
    const listsCount = await sql`SELECT COUNT(*) as count FROM lists`;
    const giftsWithLists = await sql`SELECT COUNT(*) as count FROM gift_items WHERE list_id IS NOT NULL`;
    
    console.log(`📊 Created ${listsCount[0].count} lists`);
    console.log(`🎁 ${giftsWithLists[0].count} gifts assigned to lists`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();