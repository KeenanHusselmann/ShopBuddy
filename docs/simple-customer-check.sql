-- Simple Customer Account Check
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- Check if the auth user exists at all
SELECT 
    'Auth User Exists?' as question,
    CASE 
        WHEN COUNT(*) > 0 THEN 'YES - User exists in auth.users'
        ELSE 'NO - User does not exist in auth.users'
    END as answer,
    COUNT(*) as count
FROM auth.users 
WHERE email = 'chridonpa@gmail.com';

-- Check if the profile exists
SELECT 
    'Profile Exists?' as question,
    CASE 
        WHEN COUNT(*) > 0 THEN 'YES - Profile exists in profiles table'
        ELSE 'NO - Profile does not exist in profiles table'
    END as answer,
    COUNT(*) as count
FROM public.profiles 
WHERE email = 'chridonpa@gmail.com';

-- Check if the customer record exists
SELECT 
    'Customer Record Exists?' as question,
    CASE 
        WHEN COUNT(*) > 0 THEN 'YES - Customer record exists in customers table'
        ELSE 'NO - Customer record does not exist in customers table'
    END as answer,
    COUNT(*) as count
FROM public.customers 
WHERE email = 'chridonpa@gmail.com';

-- Check if the invitation exists and its status
SELECT 
    'Invitation Status' as question,
    CASE 
        WHEN COUNT(*) = 0 THEN 'NO - No invitation found for this email'
        WHEN COUNT(*) > 0 THEN 'YES - Invitation found'
        ELSE 'Unknown'
    END as answer,
    COUNT(*) as count
FROM public.shop_customer_invitations 
WHERE email = 'chridonpa@gmail.com';

-- If invitation exists, show its details
SELECT 
    'Invitation Details' as check_type,
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
