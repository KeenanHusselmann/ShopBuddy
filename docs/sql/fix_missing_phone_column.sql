-- ========================================
-- FIX MISSING PHONE COLUMN
-- ========================================
-- This script will add the missing phone column to shop_staff_invitations

-- Add phone column to shop_staff_invitations table
ALTER TABLE public.shop_staff_invitations 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Verify the column was added
SELECT 'Phone column added successfully!' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'shop_staff_invitations' 
AND column_name = 'phone'
AND table_schema = 'public';

-- Show updated table structure
SELECT 'Updated shop_staff_invitations structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shop_staff_invitations' 
AND table_schema = 'public'
ORDER BY ordinal_position;
