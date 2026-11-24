-- Category and priority tags on gifts, and idempotency keys so an agent retrying an add after a
-- timeout gets the gift it already made instead of a duplicate. Keys are scoped to the gift's owner.
-- Run against production before deploying the code that writes them (every gift insert names them):
--   psql "$NEON_DATABASE_URL" -f scripts/neon/17-add-gift-tags-and-idempotency.sql

ALTER TABLE gift_items
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS priority text CONSTRAINT gift_items_priority_check CHECK (priority IN ('high', 'medium', 'low')),
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS gift_items_owner_idempotency_key
  ON gift_items (owner_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
