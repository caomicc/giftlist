-- Add archived column to gift_items table
ALTER TABLE gift_items ADD COLUMN archived BOOLEAN DEFAULT FALSE;

-- Create index for better performance when filtering archived items
CREATE INDEX idx_gift_items_archived ON gift_items(archived);

-- Update all existing items to not be archived
UPDATE gift_items SET archived = FALSE WHERE archived IS NULL;
