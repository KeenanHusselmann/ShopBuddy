-- Debug Customer Authentication System
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- 1. Check if the customer auth user exists
SELECT 
    'Auth User Check' as check_type,
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'chridonpa@gmail.com';

-- 2. Check if the profile exists
SELECT 
    'Profile Check' as check_type,
    id,
    first_name,
    last_name,
    email,
    role,
    shop_id,
    created_at
FROM public.profiles 
WHERE email = 'chridonpa@gmail.com' OR id IN (
    SELECT id FROM auth.users WHERE email = 'chridonpa@gmail.com'
);

-- 3. Check if the customer record exists
SELECT 
    'Customer Record Check' as check_type,
    id,
    shop_id,
    first_name,
    last_name,
    email,
    customer_type,
    created_at
FROM public.customers 
WHERE email = 'chridonpa@gmail.com' OR id IN (
    SELECT id FROM auth.users WHERE email = 'chridonpa@gmail.com'
);

-- 4. Check the function signature
SELECT 
    'Function Signature Check' as check_type,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'create_shop_customer_profile';

-- 5. Check if the function can be called manually
-- (This will help identify any runtime errors)
SELECT 'Manual function test ready' as status;

-- 6. Check the invitation status
SELECT 
    'Invitation Status Check' as check_type,
    id,
    email,
    first_name,
    last_name,
    status,
    accepted_at,
    accepted_by,
    created_at
FROM public.shop_customer_invitations 
WHERE email = 'chridonpa@gmail.com';

-- 7. Check for any recent errors in activity logs
SELECT 
    'Recent Activity Logs' as check_type,
    action,
    table_name,
    record_id,
    new_values,
    created_at
FROM public.activity_logs 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'chridonpa@gmail.com'
)
ORDER BY created_at DESC
LIMIT 5;
