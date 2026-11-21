-- Per-item currency. Every existing price is in US dollars, so existing rows default to USD.
-- Run against production before deploying the code that reads it:
--   psql "$NEON_DATABASE_URL" -f scripts/neon/14-add-currency.sql

BEGIN;

ALTER TABLE gift_items ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
ALTER TABLE gift_suggestions ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';

COMMIT;
