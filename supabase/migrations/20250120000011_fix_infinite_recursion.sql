-- Fix Infinite Recursion in RLS Policies
-- This migration removes the problematic policies causing infinite recursion

-- First, disable RLS temporarily to clear all policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies that might be causing issues
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation for new users" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create ONLY the essential, simple policies without circular references
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (
        -- Simple check: user must be authenticated and inserting their own profile
        auth.uid() IS NOT NULL AND auth.uid() = id
    );

CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (
        -- Simple check: user can only view their own profile
        auth.uid() = id
    );

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (
        -- Simple check: user can only update their own profile
        auth.uid() = id
    );

-- Ensure proper permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';
