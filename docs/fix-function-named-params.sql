-- Fix for create_shop_customer_profile Function with Named Parameters
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- Drop ALL existing versions of the function to avoid conflicts
DROP FUNCTION IF EXISTS public.create_shop_customer_profile(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_shop_customer_profile(TEXT, TEXT, UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_shop_customer_profile(TEXT, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.create_shop_customer_profile(TEXT, TEXT, UUID, UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_shop_customer_profile(JSONB);

-- Create the function that accepts a JSONB parameter (named parameters)
CREATE OR REPLACE FUNCTION public.create_shop_customer_profile(
    params JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_profile_id UUID;
    new_customer_id UUID;
    user_id_param UUID;
    first_name_param TEXT;
    last_name_param TEXT;
    email_param TEXT;
    shop_id_param UUID;
    phone_param TEXT;
    customer_type_param TEXT;
BEGIN
    -- Extract parameters from JSONB
    user_id_param := (params->>'user_id')::UUID;
    first_name_param := params->>'first_name';
    last_name_param := params->>'last_name';
    email_param := params->>'email';
    shop_id_param := (params->>'shop_id')::UUID;
    phone_param := params->>'phone';
    customer_type_param := COALESCE(params->>'customer_type', 'regular');

    -- Validate required parameters
    IF user_id_param IS NULL OR first_name_param IS NULL OR last_name_param IS NULL OR shop_id_param IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Missing required parameters');
    END IF;

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
GRANT EXECUTE ON FUNCTION public.create_shop_customer_profile(JSONB) TO authenticated;

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
SELECT 'Function created successfully with named parameters! Customer invitation should now work.' as status;
