-- Fix Profile Creation Trigger
-- This migration ensures that profiles are automatically created for new users

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace the trigger function
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

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO authenticated;

-- Ensure the function is accessible
GRANT USAGE ON SCHEMA public TO authenticated;
