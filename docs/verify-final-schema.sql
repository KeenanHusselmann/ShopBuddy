-- Verify Final Table Schema for shop_customer_invitations
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- Show the complete table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shop_customer_invitations'
ORDER BY ordinal_position;

-- Check which specific required columns are missing
SELECT 
    'id' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'id') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'shop_id' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'shop_id') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'email' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'email') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'first_name' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'first_name') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'last_name' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'last_name') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'customer_type' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'customer_type') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'phone' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'phone') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'date_of_birth' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'date_of_birth') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'age_verified' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'age_verified') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'invitation_token' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'invitation_token') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'status' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'status') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'expires_at' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'expires_at') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'created_by' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'created_by') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'created_at' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'created_at') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
    'updated_at' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'updated_at') THEN '✅' ELSE '❌' END as status;

-- Test inserting a sample record to see if there are any remaining constraint issues
-- (This will help identify any remaining problems)
SELECT 'Ready to test customer invitation creation' as status;


