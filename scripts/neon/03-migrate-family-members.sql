-- Migrated family members from Supabase
DELETE FROM family_members;

INSERT INTO family_members (id, name, avatar, color, created_at) VALUES
  ('cammy', 'Cammy', '👩', 'bg-pink-100 text-pink-800', '2025-08-06T15:58:30.041301+00:00'),
  ('nick', 'Nick', '👨', 'bg-blue-100 text-blue-800', '2025-08-06T15:58:30.041301+00:00'),
  ('ken', 'Ken', '👨', 'bg-blue-100 text-blue-800', '2025-08-06T15:58:30.041301+00:00'),
  ('sasha', 'Sasha', '👩', 'bg-purple-100 text-purple-800', '2025-08-06T15:58:30.041301+00:00'),
  ('irka', 'Irka', '👩', 'bg-purple-100 text-purple-800', '2025-08-06T15:58:30.041301+00:00'),
  ('serg', 'Serg', '👨', 'bg-green-100 text-green-800', '2025-08-06T15:58:30.041301+00:00'),
  ('masha', 'Masha', '👩', 'bg-purple-100 text-purple-800', '2025-08-06T15:58:30.041301+00:00'),
  ('lucy', 'Lucy', '👩', 'bg-purple-100 text-purple-800', '2025-08-06T15:58:30.041301+00:00'),
  ('slava', 'Slava', '👨', 'bg-green-100 text-green-800', '2025-08-06T15:58:30.041301+00:00'),
  ('dima', 'Dima', '👨', 'bg-green-100 text-green-800', '2025-08-06T15:58:30.041301+00:00'),
  ('valentina', 'Valentina', '👵', 'bg-yellow-100 text-yellow-800', '2025-08-06T15:58:30.041301+00:00'),
  ('aleftina', 'Aleftina', '👵', 'bg-yellow-100 text-yellow-800', '2025-08-06T15:58:30.041301+00:00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  avatar = EXCLUDED.avatar,
  color = EXCLUDED.color;

