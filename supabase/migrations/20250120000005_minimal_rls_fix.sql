-- Minimal RLS Fix for Profiles Table
-- This migration fixes the RLS policy that's preventing profile creation

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a new, simple insert policy
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
