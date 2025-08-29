-- Fix for Function Parameter Mismatch
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- First, let's see what functions exist with similar names
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%customer%' OR routine_name LIKE '%profile%';

-- Check the exact signature of the create_shop_customer_profile function
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'create_shop_customer_profile';

-- Drop the existing function completely
DROP FUNCTION IF EXISTS public.create_shop_customer_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_shop_customer_profile(TEXT, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.create_shop_customer_profile(TEXT, TEXT, UUID, UUID, TEXT, TEXT);

-- Create the function with the exact parameter order the application expects
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

    -- Log the activity
    INSERT INTO public.activity_logs (
        shop_id,
        user_id,
        action,
        table_name,
        record_id,
        new_values,
        metadata
    ) VALUES (
        shop_id_param,
        user_id_param,
        'customer_profile_created',
        'customers',
        new_customer_id,
        jsonb_build_object(
            'customer_id', new_customer_id,
            'email', COALESCE(email_param, ''),
            'customer_type', customer_type_param
        ),
        jsonb_build_object(
            'invitation_accepted', true,
            'profile_id', new_profile_id
        )
    );

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

-- Verify the function was created with correct signature
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'create_shop_customer_profile';

-- Test that the function is ready
SELECT 'Function created with correct parameters!' as status;
