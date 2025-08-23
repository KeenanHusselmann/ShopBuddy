-- Verify RLS Setup for Profiles Table
-- This migration ensures RLS policies are working correctly

-- First, make sure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Create a simple, working insert policy
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (
        -- Allow authenticated users to create their own profile
        auth.uid() IS NOT NULL AND auth.uid() = id
    );

-- Create a simple select policy
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (
        -- Users can view their own profile
        auth.uid() = id
        OR
        -- Super admins can view all profiles
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Create a simple update policy
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (
        -- Users can update their own profile
        auth.uid() = id
        OR
        -- Super admins can update all profiles
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Ensure proper permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';
