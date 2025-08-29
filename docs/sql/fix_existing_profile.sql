-- ========================================
-- FIX EXISTING PROFILE WITH WRONG ID
-- ========================================
-- Run this if you already have a profile with the wrong ID

-- Step 1: Check current profiles
SELECT 'Current profiles with teststaff@example.com:' as info;
SELECT id, email, first_name, last_name, role, shop_id FROM public.profiles 
WHERE email = 'teststaff@example.com';

-- Step 2: Delete the wrong profile (if it exists)
-- DELETE FROM public.profiles WHERE email = 'teststaff@example.com';

-- Step 3: Check what shops exist
SELECT 'Available shops:' as info;
SELECT id, name, description FROM public.shops;

-- Step 4: Create new profile with correct auth user ID
-- Replace 'YOUR_AUTH_USER_ID_HERE' with the actual ID from Supabase Dashboard
/*
INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    shop_id,
    phone,
    created_at,
    updated_at
) VALUES (
    'YOUR_AUTH_USER_ID_HERE', -- Replace this with the actual auth user ID
    'teststaff@example.com',
    'Test',
    'Staff',
    'staff',
    (SELECT id FROM public.shops LIMIT 1),
    '+1234567890',
    NOW(),
    NOW()
);
*/

-- Step 5: Verify the fix
SELECT 'Final verification:' as info;
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.shop_id,
    s.name as shop_name
FROM public.profiles p
JOIN public.shops s ON p.shop_id = s.id
WHERE p.email = 'teststaff@example.com';
