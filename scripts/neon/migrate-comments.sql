-- Migration: Add gift_item_comments table for collaborative commenting on gift items
-- Run with: node scripts/neon/run-comments-migration.js

-- Create the gift_item_comments table
CREATE TABLE IF NOT EXISTS gift_item_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_item_id UUID NOT NULL REFERENCES gift_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_comments_gift_item ON gift_item_comments(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON gift_item_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON gift_item_comments(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE gift_item_comments IS 'Comments on gift items for family collaboration';
COMMENT ON COLUMN gift_item_comments.gift_item_id IS 'The gift item this comment belongs to';
COMMENT ON COLUMN gift_item_comments.user_id IS 'The user who wrote the comment';
COMMENT ON COLUMN gift_item_comments.content IS 'The comment text content';
