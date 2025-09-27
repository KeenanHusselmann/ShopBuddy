-- ========================================
-- CREATE PROFILE AFTER AUTH USER EXISTS
-- ========================================
-- Run this AFTER you create the auth user in Supabase Dashboard

-- Replace 'YOUR_AUTH_USER_ID_HERE' with the actual ID from the auth user you created
-- The ID should look like: f196bf1e-b63d-4072-9a8c-5bc2e669b6a5

-- Step 1: Check what shops exist
SELECT 'Available shops:' as info;
SELECT id, name, description FROM public.shops;

-- Step 2: Create the profile (uncomment and replace the UUID)
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
    (SELECT id FROM public.shops LIMIT 1), -- Uses the first available shop
    '+1234567890',
    NOW(),
    NOW()
);
*/

-- Step 3: Verify the profile was created
SELECT 'Profile verification:' as info;
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.shop_id,
    s.name as shop_name,
    p.created_at
FROM public.profiles p
JOIN public.shops s ON p.shop_id = s.id
WHERE p.email = 'teststaff@example.com';

-- Step 4: Test credentials
SELECT 'Test Login Credentials:' as info;
SELECT 'Email: teststaff@example.com' as credential;
SELECT 'Password: testpassword123' as credential;
SELECT 'Shop Name: Use the exact shop name from verification above' as credential;
