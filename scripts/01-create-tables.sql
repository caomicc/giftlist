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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  link TEXT,
  owner_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  purchased_by TEXT REFERENCES family_members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Enable Row Level Security
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_items ENABLE ROW LEVEL SECURITY;

-- Create policies for family_members (everyone can read all family members)
CREATE POLICY "Everyone can view family members" ON family_members
  FOR SELECT USING (true);

CREATE POLICY "Everyone can insert family members" ON family_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Everyone can update family members" ON family_members
  FOR UPDATE USING (true);

-- Create policies for gift_items (everyone can read and modify all gift items)
CREATE POLICY "Everyone can view gift items" ON gift_items
  FOR SELECT USING (true);

CREATE POLICY "Everyone can insert gift items" ON gift_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Everyone can update gift items" ON gift_items
  FOR UPDATE USING (true);

CREATE POLICY "Everyone can delete gift items" ON gift_items
  FOR DELETE USING (true);
