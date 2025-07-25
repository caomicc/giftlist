-- Insert family members
INSERT INTO family_members (id, name, avatar, color) VALUES
  ('mom', 'Mom', '👩', 'bg-pink-100 text-pink-800'),
  ('dad', 'Dad', '👨', 'bg-blue-100 text-blue-800'),
  ('sarah', 'Sarah', '👧', 'bg-purple-100 text-purple-800'),
  ('mike', 'Mike', '👦', 'bg-green-100 text-green-800'),
  ('grandma', 'Grandma', '👵', 'bg-yellow-100 text-yellow-800')
ON CONFLICT (id) DO NOTHING;

-- Insert sample gift items
INSERT INTO gift_items (name, description, price, owner_id, purchased_by) VALUES
  ('Silk Scarf', 'Elegant silk scarf in blue', '$45', 'mom', NULL),
  ('Coffee Table Book', 'Photography book about gardens', '$35', 'mom', NULL),
  ('Wireless Headphones', 'Noise-canceling headphones', '$150', 'dad', NULL),
  ('Grilling Tools Set', 'Professional BBQ tool set', '$80', 'dad', NULL),
  ('Art Supplies Kit', 'Watercolor painting set', '$60', 'sarah', 'mom'),
  ('Bluetooth Speaker', 'Portable speaker for room', '$40', 'sarah', NULL),
  ('Gaming Mouse', 'RGB gaming mouse', '$70', 'mike', NULL),
  ('Skateboard', 'Complete skateboard setup', '$120', 'mike', 'dad'),
  ('Cozy Blanket', 'Soft wool throw blanket', '$55', 'grandma', NULL),
  ('Puzzle Set', '1000-piece landscape puzzles', '$25', 'grandma', NULL);
