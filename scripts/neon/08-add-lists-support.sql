-- Add support for multiple lists per user with privacy settings
-- This allows users to create multiple lists (e.g., for babies) and control visibility

-- Create the lists table
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT TRUE, -- TRUE: show purchase status to list owner, FALSE: hide purchase status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add list_id to gift_items table
ALTER TABLE gift_items
ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES lists(id) ON DELETE CASCADE;

-- Create a default list for each existing user
INSERT INTO lists (name, description, owner_id, is_public)
SELECT 
  COALESCE(u.name, 'My') || '''s List' as name,
  'Default wishlist' as description,
  u.id as owner_id,
  TRUE as is_public
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM lists l WHERE l.owner_id = u.id
);

-- Update existing gift_items to belong to the default list for each user
UPDATE gift_items
SET list_id = (
  SELECT l.id
  FROM lists l
  WHERE l.owner_id = gift_items.owner_id
  AND l.name LIKE '%List'
  LIMIT 1
)
WHERE list_id IS NULL;

-- Make list_id NOT NULL after assigning default lists
ALTER TABLE gift_items
ALTER COLUMN list_id SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lists_owner_id ON lists(owner_id);
CREATE INDEX IF NOT EXISTS idx_lists_is_public ON lists(is_public);
CREATE INDEX IF NOT EXISTS idx_gift_items_list_id ON gift_items(list_id);

-- Create trigger function for lists updated_at
CREATE OR REPLACE FUNCTION update_lists_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for lists
DROP TRIGGER IF EXISTS update_lists_updated_at ON lists;
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_lists_updated_at_column();

-- Add constraints to ensure data integrity
ALTER TABLE lists
ADD CONSTRAINT lists_name_owner_unique UNIQUE(name, owner_id);

-- Update gift_card_purchases to reference users instead of family_members
-- (since we're using users table, not family_members)
DO $$
BEGIN
    -- Try to update the foreign key constraint if it exists
    BEGIN
        ALTER TABLE gift_card_purchases
        DROP CONSTRAINT IF EXISTS gift_card_purchases_purchaser_id_fkey;
        
        -- First check if purchaser_id needs to be converted to UUID
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'gift_card_purchases'
            AND column_name = 'purchaser_id'
            AND data_type != 'uuid'
        ) THEN
            ALTER TABLE gift_card_purchases
            ALTER COLUMN purchaser_id TYPE UUID USING purchaser_id::UUID;
        END IF;
        
        ALTER TABLE gift_card_purchases
        ADD CONSTRAINT gift_card_purchases_purchaser_id_fkey
        FOREIGN KEY (purchaser_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Successfully updated purchaser_id foreign key constraint to reference users';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not update purchaser_id foreign key constraint: %', SQLERRM;
    END;
END $$;

-- Final verification
SELECT 
    'Lists created:' as status,
    COUNT(*) as count
FROM lists;

SELECT 
    'Gift items with list assignment:' as status,
    COUNT(*) as count
FROM gift_items
WHERE list_id IS NOT NULL;