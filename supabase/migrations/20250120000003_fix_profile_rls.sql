-- Fix Profile RLS Policies for New User Signup
-- This migration fixes the RLS policies to allow new users to create their profiles

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a new, more permissive insert policy that allows new users to create profiles
CREATE POLICY "Allow profile creation for new users" ON public.profiles
    FOR INSERT WITH CHECK (
        -- Allow if the user is inserting their own profile (auth.uid() = id)
        auth.uid() = id
        OR
        -- Allow if the user is authenticated and the profile doesn't exist yet
        (auth.uid() IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid()
        ))
    );

-- Also ensure the select policy allows users to view their own profile even if shop_id is null
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

-- Create a function to safely create profiles for new users
CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    user_role TEXT DEFAULT 'customer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Profile already exists for this user'
        );
    END IF;
    
    -- Insert the profile
    INSERT INTO public.profiles (
        id, 
        first_name, 
        last_name, 
        role,
        shop_registration_status
    ) VALUES (
        user_id,
        first_name,
        last_name,
        user_role::user_role,
        CASE WHEN user_role = 'shop_admin' THEN 'pending' ELSE NULL END
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Profile created successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Create a trigger function to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create profile if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        INSERT INTO public.profiles (
            id,
            first_name,
            last_name,
            role,
            shop_registration_status
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
            COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
            COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'customer'),
            CASE 
                WHEN (NEW.raw_user_meta_data ->> 'role')::user_role = 'shop_admin' THEN 'pending'
                ELSE NULL 
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT USAGE ON SEQUENCE public.profiles_id_seq TO authenticated;
