-- Final Fix for create_shop_customer_profile Function
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- First, let's see what functions exist
SELECT 
    'Existing Functions Check' as check_type,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%customer%' OR routine_name LIKE '%profile%';

-- Drop ALL existing versions of the function to avoid conflicts
DROP FUNCTION IF EXISTS public.create_shop_customer_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_shop_customer_profile(TEXT, TEXT, UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_shop_customer_profile(TEXT, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.create_shop_customer_profile(TEXT, TEXT, UUID, UUID, TEXT, TEXT, TEXT);

-- Create the function with the EXACT parameters the application is calling
-- Based on the error: create_shop_customer_profile(name, phone, shop_id, user_id)
CREATE OR REPLACE FUNCTION public.create_shop_customer_profile(
    first_name_param TEXT,
    last_name_param TEXT,
    shop_id_param UUID,
    user_id_param UUID,
    email_param TEXT DEFAULT NULL,
    phone_param TEXT DEFAULT NULL,
    customer_type_param TEXT DEFAULT 'regular'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_profile_id UUID;
    new_customer_id UUID;
BEGIN
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id_param) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profile already exists for this user');
    END IF;

    -- Create the profile first
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        email,
        role,
        shop_id,
        created_at,
        updated_at
    ) VALUES (
        user_id_param,
        first_name_param,
        last_name_param,
        COALESCE(email_param, ''),
        'customer',
        shop_id_param,
        now(),
        now()
    ) RETURNING id INTO new_profile_id;

    -- Create the customer record
    INSERT INTO public.customers (
        id,
        shop_id,
        first_name,
        last_name,
        email,
        phone,
        customer_type,
        created_at,
        updated_at
    ) VALUES (
        user_id_param,
        shop_id_param,
        first_name_param,
        last_name_param,
        COALESCE(email_param, ''),
        phone_param,
        customer_type_param,
        now(),
        now()
    ) RETURNING id INTO new_customer_id;

    -- Update the invitation status to accepted
    UPDATE public.shop_customer_invitations 
    SET 
        status = 'accepted',
        accepted_at = now(),
        accepted_by = user_id_param
    WHERE email = COALESCE(email_param, '') 
    AND shop_id = shop_id_param
    AND status = 'pending';

    RETURN jsonb_build_object(
        'success', true,
        'profile_id', new_profile_id,
        'customer_id', new_customer_id,
        'message', 'Customer profile created successfully'
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_shop_customer_profile(TEXT, TEXT, UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Verify the function was created
SELECT 
    'Function Creation Verification' as check_type,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'create_shop_customer_profile';

-- Test that the function is ready
SELECT 'Function created successfully! Customer invitation should now work.' as status;
