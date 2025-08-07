-- Add manual image URL field to gift items
-- This allows users to provide their own image URL when OG data is not available

-- Add image_url column to gift_items table
ALTER TABLE gift_items
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN gift_items.image_url IS 'Manual image URL provided by user when OG image is not available';