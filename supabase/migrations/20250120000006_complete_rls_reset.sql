-- Complete RLS Reset for Profiles Table
-- This migration completely resets all RLS policies to fix profile creation issues

-- First, disable RLS temporarily to clear all policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on the profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation for new users" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple, permissive insert policy for new users
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

-- Create a simple delete policy (optional, for admin cleanup)
CREATE POLICY "profiles_delete_policy" ON public.profiles
    FOR DELETE USING (
        -- Only super admins can delete profiles
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
