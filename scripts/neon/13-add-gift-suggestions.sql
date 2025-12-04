-- Add gift suggestions support
-- This allows users to suggest gift items to other family members

BEGIN;

-- Create gift_suggestions table
CREATE TABLE IF NOT EXISTS gift_suggestions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  suggested_by_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  link TEXT,
  image_url TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  denial_reason TEXT,
  -- OG metadata fields
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  og_site_name TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add suggested_by_id column to gift_items table for attribution
ALTER TABLE gift_items
ADD COLUMN IF NOT EXISTS suggested_by_id TEXT;

-- Add is_anonymous_suggestion column to track if suggestion was anonymous
ALTER TABLE gift_items
ADD COLUMN IF NOT EXISTS is_anonymous_suggestion BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_suggestions_suggested_by_id ON gift_suggestions(suggested_by_id);
CREATE INDEX IF NOT EXISTS idx_gift_suggestions_target_user_id ON gift_suggestions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_suggestions_status ON gift_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_gift_items_suggested_by_id ON gift_items(suggested_by_id);

-- Try to add foreign key constraints
DO $$
BEGIN
    -- Try to add suggested_by_id foreign key
    BEGIN
        ALTER TABLE gift_suggestions
        ADD CONSTRAINT gift_suggestions_suggested_by_id_fkey
        FOREIGN KEY (suggested_by_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Successfully added suggested_by_id foreign key constraint';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add suggested_by_id foreign key constraint: %', SQLERRM;
        RAISE NOTICE 'The app will function without this constraint.';
    END;

    -- Try to add target_user_id foreign key
    BEGIN
        ALTER TABLE gift_suggestions
        ADD CONSTRAINT gift_suggestions_target_user_id_fkey
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Successfully added target_user_id foreign key constraint';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add target_user_id foreign key constraint: %', SQLERRM;
        RAISE NOTICE 'The app will function without this constraint.';
    END;

    -- Try to add suggested_by_id foreign key on gift_items
    BEGIN
        ALTER TABLE gift_items
        ADD CONSTRAINT gift_items_suggested_by_id_fkey
        FOREIGN KEY (suggested_by_id) REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Successfully added gift_items.suggested_by_id foreign key constraint';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add gift_items.suggested_by_id foreign key constraint: %', SQLERRM;
        RAISE NOTICE 'The app will function without this constraint.';
    END;
END $$;

-- Display current state for verification
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE 'Created gift_suggestions table';
  RAISE NOTICE 'Added suggested_by_id column to gift_items';
  RAISE NOTICE 'Added is_anonymous_suggestion column to gift_items';
END $$;

-- Show table info
SELECT
  'gift_suggestions' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'gift_suggestions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;
