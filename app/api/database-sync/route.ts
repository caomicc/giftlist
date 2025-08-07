import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET() {
  try {
    // Check what tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    // Check gift_items table columns
    const giftItemsColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'gift_items' 
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    // Check gift_card_purchases table columns
    let giftCardPurchasesColumns: any[] = []
    try {
      giftCardPurchasesColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'gift_card_purchases' 
          AND table_schema = 'public'
        ORDER BY ordinal_position
      `
    } catch (error) {
      // Table doesn't exist
    }

    // Check users table columns
    let usersColumns: any[] = []
    try {
      usersColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND table_schema = 'public'
        ORDER BY ordinal_position
      `
    } catch (error) {
      // Table doesn't exist
    }

    // Check if triggers exist
    const triggers = await sql`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY trigger_name
    `

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      tables: tables.map(t => t.table_name),
      schema: {
        gift_items: giftItemsColumns,
        gift_card_purchases: giftCardPurchasesColumns,
        users: usersColumns
      },
      triggers: triggers
    })
  } catch (error) {
    console.error('Database diagnostic failed:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to run database diagnostic', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'run_migration') {
      // Run the complete production sync migration
      await sql`
        BEGIN;
        
        -- Add all missing columns to gift_items table
        ALTER TABLE gift_items
        ADD COLUMN IF NOT EXISTS is_gift_card BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS gift_card_target_amount DECIMAL(10,2) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS gift_card_total_purchased DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS og_title TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS og_description TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS og_image TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS og_site_name TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
      `

      await sql`
        -- Create gift card purchases table if it doesn't exist
        CREATE TABLE IF NOT EXISTS gift_card_purchases (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          gift_item_id TEXT NOT NULL,
          purchaser_id TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      await sql`
        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_gift_card_purchases_gift_item_id ON gift_card_purchases(gift_item_id);
        CREATE INDEX IF NOT EXISTS idx_gift_card_purchases_purchaser_id ON gift_card_purchases(purchaser_id);
        CREATE INDEX IF NOT EXISTS idx_gift_items_is_gift_card ON gift_items(is_gift_card);
        CREATE INDEX IF NOT EXISTS idx_gift_items_archived ON gift_items(archived);
      `

      await sql`
        -- Update any NULL archived values
        UPDATE gift_items SET archived = FALSE WHERE archived IS NULL;
      `

      await sql`
        -- Create or replace function to update gift card totals
        CREATE OR REPLACE FUNCTION update_gift_card_total()
        RETURNS TRIGGER AS $$
        BEGIN
          UPDATE gift_items
          SET gift_card_total_purchased = (
            SELECT COALESCE(SUM(amount), 0)
            FROM gift_card_purchases
            WHERE gift_item_id = COALESCE(NEW.gift_item_id, OLD.gift_item_id)
          )
          WHERE id = COALESCE(NEW.gift_item_id, OLD.gift_item_id);

          RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
      `

      await sql`
        -- Drop existing triggers and recreate them
        DROP TRIGGER IF EXISTS update_gift_card_total_on_insert ON gift_card_purchases;
        DROP TRIGGER IF EXISTS update_gift_card_total_on_update ON gift_card_purchases;
        DROP TRIGGER IF EXISTS update_gift_card_total_on_delete ON gift_card_purchases;
      `

      await sql`
        CREATE TRIGGER update_gift_card_total_on_insert
          AFTER INSERT ON gift_card_purchases
          FOR EACH ROW EXECUTE FUNCTION update_gift_card_total();
      `

      await sql`
        CREATE TRIGGER update_gift_card_total_on_update
          AFTER UPDATE ON gift_card_purchases
          FOR EACH ROW EXECUTE FUNCTION update_gift_card_total();
      `

      await sql`
        CREATE TRIGGER update_gift_card_total_on_delete
          AFTER DELETE ON gift_card_purchases
          FOR EACH ROW EXECUTE FUNCTION update_gift_card_total();
      `

      await sql`COMMIT;`

      return NextResponse.json({
        status: 'success',
        message: 'Migration completed successfully',
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to run migration', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
