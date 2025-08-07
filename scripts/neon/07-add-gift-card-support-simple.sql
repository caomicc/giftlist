-- Simplified gift card migration without foreign key constraints
-- The app handles data integrity through the API layer

-- Add new columns for gift card functionality and OpenGraph data
ALTER TABLE gift_items
ADD COLUMN IF NOT EXISTS is_gift_card BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gift_card_target_amount DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gift_card_total_purchased DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS og_title TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS og_description TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS og_image TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS og_site_name TEXT DEFAULT NULL;

-- Create gift card purchases table (no foreign keys to avoid type issues)
CREATE TABLE IF NOT EXISTS gift_card_purchases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gift_item_id TEXT NOT NULL,
  purchaser_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_card_purchases_gift_item_id ON gift_card_purchases(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_purchases_purchaser_id ON gift_card_purchases(purchaser_id);
CREATE INDEX IF NOT EXISTS idx_gift_items_is_gift_card ON gift_items(is_gift_card);

-- Create function to update gift card totals
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
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_gift_card_total_on_insert ON gift_card_purchases;
CREATE TRIGGER update_gift_card_total_on_insert
  AFTER INSERT ON gift_card_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_card_total();

DROP TRIGGER IF EXISTS update_gift_card_total_on_update ON gift_card_purchases;
CREATE TRIGGER update_gift_card_total_on_update
  AFTER UPDATE ON gift_card_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_card_total();

DROP TRIGGER IF EXISTS update_gift_card_total_on_delete ON gift_card_purchases;
CREATE TRIGGER update_gift_card_total_on_delete
  AFTER DELETE ON gift_card_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_card_total();

-- Verify setup
SELECT 'Migration completed successfully!' as status;
