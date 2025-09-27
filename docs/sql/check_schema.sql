-- ========================================
-- CHECK CURRENT DATABASE SCHEMA
-- ========================================
-- This script will show us what columns exist in our tables

-- Check shop_staff_invitations table structure
SELECT 'shop_staff_invitations table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shop_staff_invitations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check profiles table structure
SELECT 'profiles table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check shops table structure
SELECT 'shops table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shops' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if phone column exists in shop_staff_invitations
SELECT 'Phone column check:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shop_staff_invitations' 
            AND column_name = 'phone'
            AND table_schema = 'public'
        ) THEN 'Phone column EXISTS'
        ELSE 'Phone column MISSING'
    END as phone_column_status;
