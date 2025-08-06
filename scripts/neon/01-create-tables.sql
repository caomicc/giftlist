-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gift_items table
CREATE TABLE IF NOT EXISTS gift_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  link TEXT,
  owner_id TEXT NOT NULL,
  purchased_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (owner_id) REFERENCES family_members(id) ON DELETE CASCADE,
  FOREIGN KEY (purchased_by) REFERENCES family_members(id) ON DELETE SET NULL
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for gift_items
DROP TRIGGER IF EXISTS update_gift_items_updated_at ON gift_items;
CREATE TRIGGER update_gift_items_updated_at
  BEFORE UPDATE ON gift_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_items_owner_id ON gift_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_gift_items_purchased_by ON gift_items(purchased_by);
CREATE INDEX IF NOT EXISTS idx_gift_items_created_at ON gift_items(created_at DESC);
