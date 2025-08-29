-- ========================================
-- TEST STAFF INVITATION FLOW
-- ========================================
-- This script tests the complete staff invitation and registration process

-- Step 1: Check current shops
SELECT 'Available shops:' as info;
SELECT id, name, description FROM public.shops;

-- Step 2: Check current profiles
SELECT 'Current profiles:' as info;
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    s.name as shop_name
FROM public.profiles p
LEFT JOIN public.shops s ON p.shop_id = s.id
ORDER BY p.created_at DESC;

-- Step 3: Check current invitations
SELECT 'Current invitations:' as info;
SELECT 
    i.id,
    i.email,
    i.first_name,
    i.last_name,
    i.status,
    i.created_at,
    i.expires_at,
    s.name as shop_name
FROM public.shop_staff_invitations i
JOIN public.shops s ON i.shop_id = s.id
ORDER BY i.created_at DESC;

-- Step 4: Create a test invitation (replace with actual shop ID)
-- INSERT INTO public.shop_staff_invitations (
--     shop_id,
--     email,
--     first_name,
--     last_name,
--     phone,
--     role,
--     permissions,
--     status,
--     expires_at,
--     created_at
-- ) VALUES (
--     'YOUR_SHOP_ID_HERE', -- Replace with actual shop ID from step 1
--     'newstaff@example.com',
--     'New',
--     'Staff',
--     '+1234567890',
--     'staff',
--     '{}',
--     'pending',
--     (NOW() + INTERVAL '7 days'),
--     NOW()
-- );

-- Step 5: Verify invitation creation
-- SELECT 'Test invitation created:' as info;
-- SELECT 
--     i.id,
--     i.email,
--     i.first_name,
--     i.last_name,
--     i.status,
--     s.name as shop_name
-- FROM public.shop_staff_invitations i
-- JOIN public.shops s ON i.shop_id = s.id
-- WHERE i.email = 'newstaff@example.com';

-- Step 6: Test invitation link format
-- SELECT 'Invitation link format:' as info;
-- SELECT 
--     CONCAT(
--         'http://localhost:8087/staff-invitation/',
--         i.id
--     ) as invitation_link
-- FROM public.shop_staff_invitations i
-- WHERE i.email = 'newstaff@example.com';

-- Step 7: Clean up test data (run after testing)
-- DELETE FROM public.shop_staff_invitations WHERE email = 'newstaff@example.com';
-- DELETE FROM public.profiles WHERE email = 'newstaff@example.com';
-- DELETE FROM auth.users WHERE email = 'newstaff@example.com';
