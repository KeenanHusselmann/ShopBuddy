-- ========================================
-- FIX EXISTING INVITATION MISSING TOKEN
-- ========================================
-- This script will fix the existing invitation that has a null invitation_token

-- Step 1: Check the current invitation
SELECT 'Current invitation details:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    status,
    invitation_token,
    created_at
FROM public.shop_staff_invitations 
WHERE id = '881d777e-f12d-4472-8ce9-96b2514eda69';

-- Step 2: Generate a new invitation token
SELECT 'Generating new invitation token...' as info;

-- Step 3: Update the invitation with a new token
UPDATE public.shop_staff_invitations 
SET invitation_token = gen_random_uuid()::text
WHERE id = '881d777e-f12d-4472-8ce9-96b2514eda69';

-- Step 4: Verify the update
SELECT 'Updated invitation details:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    status,
    invitation_token,
    created_at
FROM public.shop_staff_invitations 
WHERE id = '881d777e-f12d-4472-8ce9-96b2514eda69';

-- Step 5: Test the new invitation link format
SELECT 'New invitation link format:' as info;
SELECT 
    CONCAT('http://localhost:8088/staff-invitation/', invitation_token) as new_invitation_link
FROM public.shop_staff_invitations 
WHERE id = '881d777e-f12d-4472-8ce9-96b2514eda69';
