-- ========================================
-- CLEANUP DATABASE FOR FRESH START
-- ========================================
-- This script will clean up test data and prepare for fresh testing

-- Step 1: Check what we're about to delete
SELECT 'Current invitations to be deleted:' as info;
SELECT 
    i.id,
    i.email,
    i.first_name,
    i.last_name,
    i.status,
    s.name as shop_name
FROM public.shop_staff_invitations i
JOIN public.shops s ON i.shop_id = s.id
WHERE i.email = 'leroy.husselmann95@gmail.com';

SELECT 'Current profiles to be deleted:' as info;
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    s.name as shop_name
FROM public.profiles p
LEFT JOIN public.shops s ON p.shop_id = s.id
WHERE p.email = 'leroy.husselmann95@gmail.com';

-- Step 2: Delete invitation
DELETE FROM public.shop_staff_invitations 
WHERE email = 'leroy.husselmann95@gmail.com';

-- Step 3: Delete profile
DELETE FROM public.profiles 
WHERE email = 'leroy.husselmann95@gmail.com';

-- Step 4: Delete auth user (this will be done manually in Supabase Dashboard)
SELECT 'MANUAL STEP: Delete auth user in Supabase Dashboard' as info;
SELECT '1. Go to Supabase Dashboard > Authentication > Users' as step;
SELECT '2. Find user: leroy.husselmann95@gmail.com' as step;
SELECT '3. Click the three dots menu' as step;
SELECT '4. Select "Delete user"' as step;
SELECT '5. Confirm deletion' as step;

-- Step 5: Verify cleanup
SELECT 'Cleanup verification:' as info;
SELECT 'Invitations remaining:' as info;
SELECT COUNT(*) as invitation_count FROM public.shop_staff_invitations;

SELECT 'Profiles remaining:' as info;
SELECT COUNT(*) as profile_count FROM public.profiles;

-- Step 6: Show current state
SELECT 'Current shops:' as info;
SELECT id, name, description FROM public.shops;

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

SELECT 'Current invitations:' as info;
SELECT 
    i.id,
    i.email,
    i.first_name,
    i.last_name,
    i.status,
    s.name as shop_name
FROM public.shop_staff_invitations i
JOIN public.shops s ON i.shop_id = s.id
ORDER BY i.created_at DESC;
