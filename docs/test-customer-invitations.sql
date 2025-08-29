-- Test script for Customer Invitations table
-- Run this AFTER running the fix-customer-invitations-table.sql script

-- 1. Check if the table exists
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_name = 'shop_customer_invitations';

-- 2. Check the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shop_customer_invitations'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'shop_customer_invitations';

-- 4. Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'shop_customer_invitations';

-- 5. Test inserting a sample invitation (this should work if you're authenticated as shop_admin)
-- Note: Replace 'your-shop-id-here' with an actual shop ID from your database
/*
INSERT INTO public.shop_customer_invitations (
    shop_id,
    email,
    first_name,
    last_name,
    customer_type,
    phone,
    date_of_birth,
    age_verified,
    invitation_token,
    expires_at
) VALUES (
    'your-shop-id-here'::uuid,
    'test@example.com',
    'Test',
    'Customer',
    'retail',
    '+1234567890',
    '1990-01-01',
    true,
    'test-token-123',
    now() + interval '7 days'
);
*/

-- 6. Check if the insert worked
SELECT 
    id,
    email,
    first_name,
    last_name,
    customer_type,
    status,
    created_at
FROM public.shop_customer_invitations
ORDER BY created_at DESC
LIMIT 5;



