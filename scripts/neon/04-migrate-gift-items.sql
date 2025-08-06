-- Migrated gift items from Supabase
DELETE FROM gift_items;

INSERT INTO gift_items (id, name, description, price, link, owner_id, purchased_by, created_at, updated_at) VALUES
  ('c6b669cc-c710-4fcd-873a-e7786ff46728', 'Silk Scarf', 'Elegant silk scarf in blue', '$45', NULL, 'cammy', NULL, '2025-08-06T15:58:30.041301+00:00', '2025-08-06T15:58:30.041301+00:00'),
  ('b33527f2-9e5b-4ef3-b95f-1ea4af89fff5', 'Coffee Table Book', 'Photography book about gardens', '$35', NULL, 'cammy', NULL, '2025-08-06T15:58:30.041301+00:00', '2025-08-06T15:58:30.041301+00:00'),
  ('942ee3cd-0264-49af-99aa-f198f5348bf6', 'Wireless Headphones', 'Noise-canceling headphones', '$150', NULL, 'nick', NULL, '2025-08-06T15:58:30.041301+00:00', '2025-08-06T15:58:30.041301+00:00'),
  ('c5f9fa97-5082-4763-be1e-0e417b509f91', 'Grilling Tools Set', 'Professional BBQ tool set', '$80', NULL, 'nick', NULL, '2025-08-06T15:58:30.041301+00:00', '2025-08-06T15:58:30.041301+00:00'),
  ('f1f502f0-8567-4c2b-8dc6-50bdb1a8a83f', 'Art Supplies Kit', 'Watercolor painting set', '$60', NULL, 'sasha', 'masha', '2025-08-06T15:58:30.041301+00:00', '2025-08-06T15:58:30.041301+00:00'),
  ('4f27912d-32b9-414d-a7f1-870cf458ab2c', 'Bluetooth Speaker', 'Portable speaker for room', '$40', NULL, 'sasha', NULL, '2025-08-06T15:58:30.041301+00:00', '2025-08-06T15:58:30.041301+00:00'),
  ('2b803280-4d18-46ae-8567-5c416b9b5e4b', 'Gaming Mouse', 'RGB gaming mouse', '$70', NULL, 'serg', NULL, '2025-08-06T15:58:30.041301+00:00', '2025-08-06T15:58:30.041301+00:00'),
  ('a1e6700e-c1a9-42b0-a283-a473451e2a2b', 'Skateboard', 'Complete skateboard setup', '$120', NULL, 'serg', 'nick', '2025-08-06T15:58:30.041301+00:00', '2025-08-06T15:58:30.041301+00:00'),
  ('cf24a9fb-6f92-4b49-b3f0-6272e21c241b', 'Cozy Blanket', 'Soft wool throw blanket', '$55', NULL, 'valentina', NULL, '2025-08-06T15:58:30.041301+00:00', '2025-08-06T15:58:30.041301+00:00'),
  ('f6b4a47c-ce21-4a74-982e-3f9887d54f86', 'Puzzle Set', '1000-piece landscape puzzles', '$25', NULL, 'valentina', NULL, '2025-08-06T15:58:30.041301+00:00', '2025-08-06T15:58:30.041301+00:00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  link = EXCLUDED.link,
  owner_id = EXCLUDED.owner_id,
  purchased_by = EXCLUDED.purchased_by,
  updated_at = EXCLUDED.updated_at;

