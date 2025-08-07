const { sql } = require('./lib/neon.ts');
const fs = require('fs');

async function migrate() {
  try {
    const migrationSQL = fs.readFileSync('./scripts/neon/07-add-gift-card-support.sql', 'utf8');
    console.log('Running gift card migration...');
    
    // Split SQL commands by semicolon and execute them individually
    const commands = migrationSQL.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        console.log('Executing:', command.substring(0, 50) + '...');
        await sql`${command}`;
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
