-- Debug Customer Authentication Issue
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- 1. Check the exact state of the auth user
SELECT 
    'Auth User Details' as check_type,
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'chridonpa@gmail.com';

-- 2. Check if the profile was created correctly
SELECT 
    'Profile Details' as check_type,
    id,
    first_name,
    last_name,
    email,
    role,
    shop_id,
    created_at,
    updated_at
FROM public.profiles 
WHERE email = 'chridonpa@gmail.com';

-- 3. Check if the customer record was created
SELECT 
    'Customer Record Details' as check_type,
    id,
    shop_id,
    first_name,
    last_name,
    email,
    customer_type,
    phone,
    created_at
FROM public.customers 
WHERE email = 'chridonpa@gmail.com';

-- 4. Check the invitation status
SELECT 
    'Invitation Status' as check_type,
    id,
    email,
    first_name,
    last_name,
    status,
    accepted_at,
    accepted_by,
    invitation_token,
    expires_at,
    created_at
FROM public.shop_customer_invitations 
WHERE email = 'chridonpa@gmail.com';

-- 5. Check if there are any password-related issues
SELECT 
    'Password Check' as check_type,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'Email not confirmed'
        WHEN email_confirmed_at IS NOT NULL THEN 'Email confirmed'
        ELSE 'Unknown email status'
    END as email_status,
    CASE 
        WHEN last_sign_in_at IS NULL THEN 'Never signed in'
        WHEN last_sign_in_at IS NOT NULL THEN 'Has signed in before'
        ELSE 'Unknown sign-in status'
    END as sign_in_status
FROM auth.users 
WHERE email = 'chridonpa@gmail.com';

-- 6. Check for any recent authentication attempts
SELECT 
    'Recent Auth Attempts' as check_type,
    'Check Supabase logs for authentication failures' as note;
