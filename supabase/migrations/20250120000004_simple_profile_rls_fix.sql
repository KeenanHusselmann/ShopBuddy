-- Simple Profile RLS Fix
-- This migration fixes the RLS policies to allow new users to create their profiles

-- Drop the existing problematic insert policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a new, more permissive insert policy that allows new users to create profiles
CREATE POLICY "Allow profile creation for new users" ON public.profiles
    FOR INSERT WITH CHECK (
        -- Allow if the user is inserting their own profile (auth.uid() = id)
        auth.uid() = id
    );

-- Ensure the select policy allows users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Ensure the update policy allows users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Add a policy to allow super admins to view all profiles (for admin dashboard)
CREATE POLICY IF NOT EXISTS "Super admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Add a policy to allow super admins to update all profiles
CREATE POLICY IF NOT EXISTS "Super admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
