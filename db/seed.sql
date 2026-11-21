-- Fake family for the local database (db:up / db:reset). Never load this into production.
-- Every user's password is: password123
-- Fixed ids (00000000-0000-4000-8000-0000000000NN) so e2e tests can refer to known records.
BEGIN;

INSERT INTO public.users (id, email, name, email_verified, password_hash) VALUES
  ('00000000-0000-4000-8000-000000000001', 'alex@example.com',   'Alex Rivera',  now(), '$2b$10$nwvdLIrTQlnf7cq/9hTFVOYF9iWv2rFyspfcLinzuZBzuU3L1EtpG'),
  ('00000000-0000-4000-8000-000000000002', 'sam@example.com',    'Sam Chen',     now(), '$2b$10$nwvdLIrTQlnf7cq/9hTFVOYF9iWv2rFyspfcLinzuZBzuU3L1EtpG'),
  ('00000000-0000-4000-8000-000000000003', 'jordan@example.com', 'Jordan Patel', now(), '$2b$10$nwvdLIrTQlnf7cq/9hTFVOYF9iWv2rFyspfcLinzuZBzuU3L1EtpG'),
  ('00000000-0000-4000-8000-000000000004', 'riley@example.com',  'Riley Okafor', now(), '$2b$10$nwvdLIrTQlnf7cq/9hTFVOYF9iWv2rFyspfcLinzuZBzuU3L1EtpG');

-- is_public: whether the owner sees purchase status. Sam keeps surprises hidden.
INSERT INTO public.lists (id, name, description, owner_id, is_public) VALUES
  ('00000000-0000-4000-8000-000000000101', 'Alex''s wishlist',   'Kitchen and camping things', '00000000-0000-4000-8000-000000000001', true),
  ('00000000-0000-4000-8000-000000000102', 'Sam''s wishlist',    'Surprise me!',               '00000000-0000-4000-8000-000000000002', false),
  ('00000000-0000-4000-8000-000000000103', 'Jordan''s wishlist', NULL,                         '00000000-0000-4000-8000-000000000003', true),
  ('00000000-0000-4000-8000-000000000104', 'Riley''s wishlist',  'Books and games',            '00000000-0000-4000-8000-000000000004', true);

INSERT INTO public.gift_items (id, name, description, price, link, owner_id, list_id, purchased_by, is_gift_card, gift_card_target_amount, gift_card_total_purchased, is_group_gift, archived) VALUES
  ('00000000-0000-4000-8000-000000000201', 'Cast iron skillet',     '12 inch, pre-seasoned',  '45.00',  'https://example.com/skillet', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', NULL, false, NULL,   0,     false, false),
  ('00000000-0000-4000-8000-000000000202', 'Wool hiking socks',     'Size M',                 '24.00',  NULL,                          '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', NULL, false, NULL,   0,     false, false),
  ('00000000-0000-4000-8000-000000000203', 'Board game: Wingspan',  NULL,                     '65.00',  'https://example.com/game',    '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000004',  false, NULL,   0,     false, false),
  ('00000000-0000-4000-8000-000000000204', 'Bookshop gift card',    'Any amount helps',       NULL,     NULL,                          '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000104', NULL, true,  100.00, 45.00, false, false),
  ('00000000-0000-4000-8000-000000000205', 'Two-person tent',       'Going in on this one together', '320.00', NULL,                   '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', NULL, false, NULL,   0,     true,  false),
  ('00000000-0000-4000-8000-000000000206', 'Chef''s knife',         NULL,                     '80.00',  NULL,                          '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', NULL, false, NULL,   0,     false, false),
  ('00000000-0000-4000-8000-000000000207', 'Old phone case',        'No longer needed',       '15.00',  NULL,                          '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000103', NULL, false, NULL,   0,     false, true);

INSERT INTO public.gift_card_purchases (gift_item_id, purchaser_id, amount) VALUES
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000001', 25.00),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000002', 20.00);

INSERT INTO public.gift_interest (gift_item_id, user_id) VALUES
  ('00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000003');

INSERT INTO public.gift_suggestions (suggested_by_id, target_user_id, name, description, price, status) VALUES
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'Noise-cancelling headphones', 'For the commute', '199.00', 'pending');

INSERT INTO public.gift_item_comments (gift_item_id, user_id, content) VALUES
  ('00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000002', 'I can chip in $80.'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000001', 'Great pick, they will love it.');

COMMIT;
