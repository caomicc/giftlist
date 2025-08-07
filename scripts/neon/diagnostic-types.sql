-- Diagnostic script to check column types
-- Run this in Neon console to see what types we're working with

-- Check gift_items table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'gift_items' 
ORDER BY ordinal_position;

-- Check family_members table structure  
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'family_members' 
ORDER BY ordinal_position;

-- Check if there are any existing gift_items to see their actual ID format
SELECT id, name FROM gift_items LIMIT 5;

-- Check if there are any family_members to see their actual ID format
SELECT id, name FROM family_members LIMIT 5;
