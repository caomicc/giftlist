-- When the owner last edited a gift's details. Not updated_at: a trigger bumps that on every
-- write, claims and gift card contributions included, so showing it would tell the owner of a
-- surprise list when something was bought. NULL means never edited (existing rows start NULL).
-- Run against production before deploying the code that reads it:
--   psql "$NEON_DATABASE_URL" -f scripts/neon/16-add-gift-edited-at.sql

ALTER TABLE gift_items ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;
