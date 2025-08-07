-- Add gift card support to gift_items table
-- This allows tracking of gift card amounts instead of just boolean purchased status

-- First, let's check the current table structure
-- Run this to see what types we're working with:
-- \d gift_items;
-- \d family_members;

-- Add new columns for gift card functionality
ALTER TABLE gift_items
ADD COLUMN IF NOT EXISTS is_gift_card BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gift_card_target_amount DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gift_card_total_purchased DECIMAL(10,2) DEFAULT 0.00;

-- Create a new table to track individual gift card purchases
-- Start simple without foreign key constraints first
CREATE TABLE IF NOT EXISTS gift_card_purchases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gift_item_id TEXT NOT NULL,
  purchaser_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (these should work regardless)
CREATE INDEX IF NOT EXISTS idx_gift_card_purchases_gift_item_id ON gift_card_purchases(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_purchases_purchaser_id ON gift_card_purchases(purchaser_id);
CREATE INDEX IF NOT EXISTS idx_gift_items_is_gift_card ON gift_items(is_gift_card);

-- Create a function to update the total purchased amount for gift cards
CREATE OR REPLACE FUNCTION update_gift_card_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the total purchased amount for the gift card
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

-- Create triggers to automatically update gift card totals
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

-- Now try to add foreign key constraints
-- If these fail, we can still proceed without them (the app will handle data integrity)
DO $$
BEGIN
    -- Try to add gift_item_id foreign key
    BEGIN
        -- First check if gift_items.id is UUID or TEXT
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'gift_items'
            AND column_name = 'id'
            AND data_type = 'uuid'
        ) THEN
            -- gift_items.id is UUID, so we need to cast
            ALTER TABLE gift_card_purchases
            ALTER COLUMN gift_item_id TYPE UUID USING gift_item_id::UUID;
        END IF;

        ALTER TABLE gift_card_purchases
        ADD CONSTRAINT gift_card_purchases_gift_item_id_fkey
        FOREIGN KEY (gift_item_id) REFERENCES gift_items(id) ON DELETE CASCADE;
        RAISE NOTICE 'Successfully added gift_item_id foreign key constraint';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add gift_item_id foreign key constraint: %', SQLERRM;
        RAISE NOTICE 'The app will function without this constraint.';
    END;

    -- Try to add purchaser_id foreign key
    BEGIN
        ALTER TABLE gift_card_purchases
        ADD CONSTRAINT gift_card_purchases_purchaser_id_fkey
        FOREIGN KEY (purchaser_id) REFERENCES family_members(id) ON DELETE CASCADE;
        RAISE NOTICE 'Successfully added purchaser_id foreign key constraint';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add purchaser_id foreign key constraint: %', SQLERRM;
        RAISE NOTICE 'The app will function without this constraint.';
    END;
END $$;

-- Final status check
SELECT
    'gift_card_purchases' as table_name,
    COUNT(*) as total_constraints,
    COUNT(CASE WHEN constraint_name LIKE '%gift_item_id%' THEN 1 END) as gift_item_fk,
    COUNT(CASE WHEN constraint_name LIKE '%purchaser_id%' THEN 1 END) as purchaser_fk
FROM information_schema.table_constraints
WHERE table_name = 'gift_card_purchases'
AND constraint_type = 'FOREIGN KEY';
