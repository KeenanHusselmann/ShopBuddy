-- ========================================
-- FIX RLS POLICIES FOR STAFF INVITATIONS
-- ========================================
-- This script will check and fix RLS policies to allow invitation access

-- Step 1: Check current RLS status
SELECT 'Current RLS status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'shop_staff_invitations';

-- Step 2: Check existing policies
SELECT 'Existing policies:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'shop_staff_invitations';

-- Step 3: Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.shop_staff_invitations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.shop_staff_invitations;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.shop_staff_invitations;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.shop_staff_invitations;

-- Step 4: Create new RLS policies
-- Policy 1: Allow anyone to read invitations by token (for invitation acceptance)
CREATE POLICY "Enable read access for invitation tokens" ON public.shop_staff_invitations
    FOR SELECT USING (true);

-- Policy 2: Allow shop admins to insert invitations
CREATE POLICY "Enable insert for shop admins" ON public.shop_staff_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'shop_admin'
        )
    );

-- Policy 3: Allow shop admins to update their own invitations
CREATE POLICY "Enable update for shop admins" ON public.shop_staff_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'shop_admin'
        )
    );

-- Policy 4: Allow shop admins to delete their own invitations
CREATE POLICY "Enable delete for shop admins" ON public.shop_staff_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'shop_admin'
        )
    );

-- Step 5: Verify policies were created
SELECT 'New policies created:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'shop_staff_invitations';

-- Step 6: Test invitation access (this should work now)
SELECT 'Testing invitation access:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    status,
    invitation_token
FROM public.shop_staff_invitations 
LIMIT 5;
