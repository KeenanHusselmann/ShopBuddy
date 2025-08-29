-- ========================================
-- CREATE TEST STAFF USER FOR TESTING
-- ========================================

-- First, let's check what shops exist
SELECT 'Available shops:' as info;
SELECT id, name, description FROM public.shops;

-- IMPORTANT: You need to create the auth user FIRST in Supabase Dashboard
-- Then use that user ID to create the profile

-- Step 1: Create auth user in Supabase Dashboard
SELECT 'STEP 1: Create Auth User in Supabase Dashboard' as info;
SELECT '1. Go to Supabase Dashboard > Authentication > Users' as step;
SELECT '2. Click "Add User"' as step;
SELECT '3. Enter email: teststaff@example.com' as step;
SELECT '4. Enter password: testpassword123' as step;
SELECT '5. Copy the generated user ID (it will look like: f196bf1e-b63d-4072-9a8c-5bc2e669b6a5)' as step;

-- Step 2: After creating the auth user, run this to create the profile
-- Replace 'YOUR_AUTH_USER_ID_HERE' with the actual ID from step 1
SELECT 'STEP 2: Create Profile (run after creating auth user)' as info;

-- First, let's check if the profile already exists
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

-- If no profile exists, create one (replace the UUID with your actual auth user ID)
-- INSERT INTO public.profiles (
--     id,
--     email,
--     first_name,
--     last_name,
--     role,
--     shop_id,
--     phone,
--     created_at,
--     updated_at
-- ) VALUES (
--     'YOUR_AUTH_USER_ID_HERE', -- Replace this with the actual auth user ID
--     'teststaff@example.com',
--     'Test',
--     'Staff',
--     'staff',
--     (SELECT id FROM public.shops LIMIT 1),
--     '+1234567890',
--     NOW(),
--     NOW()
-- );

-- Step 3: Update existing profile if it exists
-- UPDATE public.profiles 
-- SET 
--     first_name = 'Test',
--     last_name = 'Staff',
--     role = 'staff',
--     shop_id = (SELECT id FROM public.shops LIMIT 1),
--     phone = '+1234567890',
--     updated_at = NOW()
-- WHERE email = 'teststaff@example.com';

-- Step 4: Verify the final setup
SELECT 'STEP 3: Verify Setup' as info;
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

-- Step 5: Test login credentials
SELECT 'STEP 4: Test Login Credentials' as info;
SELECT 'Email: teststaff@example.com' as credential;
SELECT 'Password: testpassword123' as credential;
SELECT 'Shop Name: Use the exact shop name from the verification above' as credential;

-- Troubleshooting: If you get foreign key errors
SELECT 'TROUBLESHOOTING:' as info;
SELECT 'If you get foreign key errors:' as issue;
SELECT '1. Make sure you created the auth user FIRST in Supabase Dashboard' as solution;
SELECT '2. Copy the exact user ID from the auth users table' as solution;
SELECT '3. Use that exact ID when creating/updating the profile' as solution;
SELECT '4. The profile ID must match the auth.users ID exactly' as solution;
