-- Complete production sync script
-- This script will ensure all necessary tables and columns exist for the full feature set

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

-- Create gift card purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS gift_card_purchases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gift_item_id TEXT NOT NULL,
  purchaser_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_card_purchases_gift_item_id ON gift_card_purchases(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_purchases_purchaser_id ON gift_card_purchases(purchaser_id);
CREATE INDEX IF NOT EXISTS idx_gift_items_is_gift_card ON gift_items(is_gift_card);
CREATE INDEX IF NOT EXISTS idx_gift_items_archived ON gift_items(archived);

-- Update any NULL archived values
UPDATE gift_items SET archived = FALSE WHERE archived IS NULL;

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

-- Drop existing triggers and recreate them
DROP TRIGGER IF EXISTS update_gift_card_total_on_insert ON gift_card_purchases;
DROP TRIGGER IF EXISTS update_gift_card_total_on_update ON gift_card_purchases;
DROP TRIGGER IF EXISTS update_gift_card_total_on_delete ON gift_card_purchases;

CREATE TRIGGER update_gift_card_total_on_insert
  AFTER INSERT ON gift_card_purchases
  FOR EACH ROW EXECUTE FUNCTION update_gift_card_total();

CREATE TRIGGER update_gift_card_total_on_update
  AFTER UPDATE ON gift_card_purchases
  FOR EACH ROW EXECUTE FUNCTION update_gift_card_total();

CREATE TRIGGER update_gift_card_total_on_delete
  AFTER DELETE ON gift_card_purchases
  FOR EACH ROW EXECUTE FUNCTION update_gift_card_total();

-- Display current state for verification
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE 'Checking table structure...';
END $$;

-- Show table info
SELECT 
  'gift_items' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'gift_items'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  'gift_card_purchases' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'gift_card_purchases'
  AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;
