-- Add list visibility setting (hide from other users)
-- This is different from is_public (which controls purchase status visibility)
-- This controls whether the entire list is shown to other family members

-- Add is_visible column to lists table
ALTER TABLE lists
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

-- Update existing lists to be visible by default
UPDATE lists 
SET is_visible = TRUE 
WHERE is_visible IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE lists
ALTER COLUMN is_visible SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_lists_is_visible ON lists(is_visible);

-- Add constraint documentation comment
COMMENT ON COLUMN lists.is_visible IS 'Controls whether list is shown to other family members. TRUE = visible to others, FALSE = hidden from others';
COMMENT ON COLUMN lists.is_public IS 'Controls whether purchase status is shown to list owner. TRUE = show purchases, FALSE = hide purchases';