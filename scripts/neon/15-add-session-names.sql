-- Agent tokens (Claude Code, Hermes) are session rows with a name; browser sessions have none.
-- Run against production before deploying the code that reads it:
--   psql "$NEON_DATABASE_URL" -f scripts/neon/15-add-session-names.sql

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS name text;
