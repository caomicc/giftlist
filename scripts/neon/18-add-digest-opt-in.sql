-- Whether the user gets the daily new-gifts email. Opt-in: everyone, existing users included, starts off.
-- Run against production before deploying the code that reads it:
--   psql "$NEON_DATABASE_URL" -f scripts/neon/18-add-digest-opt-in.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS digest_opt_in boolean NOT NULL DEFAULT false;
