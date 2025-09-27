-- Remove Problematic Trigger
-- This migration removes the trigger that's causing database errors during signup

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.handle_new_user_signup();

-- Also drop any other similar functions that might exist
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ensure RLS is properly configured for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple, working insert policy
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (
        -- Allow authenticated users to create their own profile
        auth.uid() IS NOT NULL AND auth.uid() = id
    );

-- Ensure proper permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
