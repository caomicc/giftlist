-- Add password support to existing auth tables
-- Run this after 05-create-auth-tables.sql

-- Add password field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Create index for email lookups (performance)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
