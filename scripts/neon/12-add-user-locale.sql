-- Add preferred_locale column to users table
-- This stores the user's language preference for emails and default UI language

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(5) DEFAULT 'en';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_preferred_locale ON users(preferred_locale);

-- Update existing users to have default locale
UPDATE users SET preferred_locale = 'en' WHERE preferred_locale IS NULL;
