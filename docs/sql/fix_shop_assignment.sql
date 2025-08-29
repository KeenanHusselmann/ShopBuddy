-- ========================================
-- FIX SHOP ASSIGNMENT FOR TEST STAFF USER
-- ========================================
-- This script will update the test staff profile to point to CK's Creations

-- Step 1: Check current shops
SELECT 'Available shops:' as info;
SELECT id, name, description FROM public.shops;

-- Step 2: Check current profile assignment
SELECT 'Current profile assignment:' as info;
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.shop_id,
    s.name as current_shop_name
FROM public.profiles p
LEFT JOIN public.shops s ON p.shop_id = s.id
WHERE p.email = 'teststaff@example.com';

-- Step 3: Find CK's Creations shop
SELECT 'Looking for CK''s Creations shop:' as info;
SELECT id, name, description FROM public.shops 
WHERE name ILIKE '%CK%Creations%' OR name ILIKE '%CK''s%Creations%';

-- Step 4: Update profile to point to CK's Creations
-- Replace 'CK_CREATIONS_SHOP_ID' with the actual shop ID from step 3
UPDATE public.profiles 
SET 
    shop_id = (SELECT id FROM public.shops WHERE name ILIKE '%CK%Creations%' OR name ILIKE '%CK''s%Creations%' LIMIT 1),
    updated_at = NOW()
WHERE email = 'teststaff@example.com';

-- Step 5: Verify the update
SELECT 'Profile after update:' as info;
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.shop_id,
    s.name as new_shop_name,
    p.updated_at
FROM public.profiles p
JOIN public.shops s ON p.shop_id = s.id
WHERE p.email = 'teststaff@example.com';

-- Step 6: Test credentials
SELECT 'Updated test credentials:' as info;
SELECT 'Email: teststaff@example.com' as credential;
SELECT 'Password: testpassword123' as credential;
SELECT 'Shop Name: CK''s Creations' as credential;
