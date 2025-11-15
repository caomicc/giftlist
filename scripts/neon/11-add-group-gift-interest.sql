-- Add group gift support
-- This allows tracking which users are interested in participating in group gifts

BEGIN;

-- Add is_group_gift column to gift_items table
ALTER TABLE gift_items
ADD COLUMN IF NOT EXISTS is_group_gift BOOLEAN DEFAULT FALSE;

-- Create gift_interest table to track user interest in group gifts
CREATE TABLE IF NOT EXISTS gift_interest (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gift_item_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gift_item_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_interest_gift_item_id ON gift_interest(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_gift_interest_user_id ON gift_interest(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_items_is_group_gift ON gift_items(is_group_gift);

-- Try to add foreign key constraints (will work if data types match)
DO $$
BEGIN
    -- Try to add gift_item_id foreign key
    BEGIN
        ALTER TABLE gift_interest
        ADD CONSTRAINT gift_interest_gift_item_id_fkey
        FOREIGN KEY (gift_item_id) REFERENCES gift_items(id) ON DELETE CASCADE;
        RAISE NOTICE 'Successfully added gift_item_id foreign key constraint';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add gift_item_id foreign key constraint: %', SQLERRM;
        RAISE NOTICE 'The app will function without this constraint.';
    END;

    -- Try to add user_id foreign key
    BEGIN
        ALTER TABLE gift_interest
        ADD CONSTRAINT gift_interest_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Successfully added user_id foreign key constraint';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add user_id foreign key constraint: %', SQLERRM;
        RAISE NOTICE 'The app will function without this constraint.';
    END;
END $$;

-- Display current state for verification
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE 'Added is_group_gift column to gift_items';
  RAISE NOTICE 'Created gift_interest table';
END $$;

-- Show table info
SELECT
  'gift_interest' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'gift_interest'
  AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;
