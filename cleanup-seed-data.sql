-- Clean up seed data from the database
-- This will remove the fake users and gift items that were created for testing

-- Delete gift items first (due to foreign key constraints)
DELETE FROM gift_items
WHERE owner_id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440005'
);

-- Delete the fake seed users
DELETE FROM users
WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001', -- Cammy
  '550e8400-e29b-41d4-a716-446655440002', -- Nick
  '550e8400-e29b-41d4-a716-446655440003', -- Sasha
  '550e8400-e29b-41d4-a716-446655440004', -- Masha
  '550e8400-e29b-41d4-a716-446655440005'  -- Serg
);

-- Optional: Check remaining data
-- SELECT COUNT(*) as remaining_users FROM users;
-- SELECT COUNT(*) as remaining_gifts FROM gift_items;
