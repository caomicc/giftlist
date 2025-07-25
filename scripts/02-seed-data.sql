DELETE FROM gift_items;
DELETE FROM family_members;

-- Insert family members
INSERT INTO family_members (id, name, avatar, color) VALUES
  ('cammy', 'Cammy', '👩', 'bg-pink-100 text-pink-800'),
  ('nick', 'Nick', '👨', 'bg-blue-100 text-blue-800'),
  ('ken', 'Ken', '👨', 'bg-blue-100 text-blue-800'),
  ('sasha', 'Sasha', '👩', 'bg-purple-100 text-purple-800'),
  ('irka', 'Irka', '👩', 'bg-purple-100 text-purple-800'),
  ('serg', 'Serg', '👨', 'bg-green-100 text-green-800'),
  ('masha', 'Masha', '👩', 'bg-purple-100 text-purple-800'),
  ('lucy', 'Lucy', '👩', 'bg-purple-100 text-purple-800'),
  ('slava', 'Slava', '👨', 'bg-green-100 text-green-800'),
  ('dima', 'Dima', '👨', 'bg-green-100 text-green-800'),
  ('valentina', 'Valentina', '👵', 'bg-yellow-100 text-yellow-800'),
  ('aleftina', 'Aleftina', '👵', 'bg-yellow-100 text-yellow-800')
ON CONFLICT (id) DO NOTHING;

-- Insert sample gift items
INSERT INTO gift_items (name, description, price, owner_id, purchased_by) VALUES
  ('Silk Scarf', 'Elegant silk scarf in blue', '$45', 'cammy', NULL),
  ('Coffee Table Book', 'Photography book about gardens', '$35', 'cammy', NULL),
  ('Wireless Headphones', 'Noise-canceling headphones', '$150', 'nick', NULL),
  ('Grilling Tools Set', 'Professional BBQ tool set', '$80', 'nick', NULL),
  ('Art Supplies Kit', 'Watercolor painting set', '$60', 'sasha', 'masha'),
  ('Bluetooth Speaker', 'Portable speaker for room', '$40', 'sasha', NULL),
  ('Gaming Mouse', 'RGB gaming mouse', '$70', 'serg', NULL),
  ('Skateboard', 'Complete skateboard setup', '$120', 'serg', 'nick'),
  ('Cozy Blanket', 'Soft wool throw blanket', '$55', 'valentina', NULL),
  ('Puzzle Set', '1000-piece landscape puzzles', '$25', 'valentina', NULL);
