-- ========================================
-- CREATE PROFILE WITH YOUR AUTH USER ID
-- ========================================
-- This script is ready to run with your auth user ID: a22f4803-b6e8-4d98-92bd-ab00094c0742

-- Step 1: Check what shops exist
SELECT 'Available shops:' as info;
SELECT id, name, description FROM public.shops;

-- Step 2: Check if profile already exists
SELECT 'Checking if profile already exists:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    shop_id,
    created_at
FROM public.profiles 
WHERE email = 'teststaff@example.com';

-- Step 3: Create the profile with your auth user ID
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
    'a22f4803-b6e8-4d98-92bd-ab00094c0742', -- Your actual auth user ID
    'teststaff@example.com',
    'Test',
    'Staff',
    'staff',
    (SELECT id FROM public.shops LIMIT 1), -- Uses the first available shop
    '+1234567890',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    shop_id = EXCLUDED.shop_id,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- Step 4: Verify the profile was created
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

-- Step 5: Test credentials
SELECT 'Test Login Credentials:' as info;
SELECT 'Email: teststaff@example.com' as credential;
SELECT 'Password: testpassword123' as credential;
SELECT 'Shop Name: Use the exact shop name from verification above' as credential;

-- Step 6: Final verification
SELECT 'Final setup verification:' as info;
SELECT 
    p.id as auth_user_id,
    p.email,
    p.first_name || ' ' || p.last_name as full_name,
    p.role,
    s.name as shop_name,
    p.shop_id,
    p.created_at
FROM public.profiles p
JOIN public.shops s ON p.shop_id = s.id
WHERE p.email = 'teststaff@example.com';
