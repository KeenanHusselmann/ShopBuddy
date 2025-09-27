-- Manual Fix for Customer Profile - Run this AFTER the debug script
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- First, let's get the user ID and shop ID from the invitation
DO $$
DECLARE
    user_id_val UUID;
    shop_id_val UUID;
    invitation_data RECORD;
BEGIN
    -- Get the invitation data
    SELECT * INTO invitation_data
    FROM public.shop_customer_invitations 
    WHERE email = 'chridonpa@gmail.com' 
    AND status = 'accepted'
    LIMIT 1;

    IF invitation_data IS NULL THEN
        RAISE NOTICE 'No accepted invitation found for chridonpa@gmail.com';
        RETURN;
    END IF;

    user_id_val := invitation_data.accepted_by;
    shop_id_val := invitation_data.shop_id;

    RAISE NOTICE 'Found user_id: %, shop_id: %', user_id_val, shop_id_val;

    -- Check if profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id_val) THEN
        -- Create the profile
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
            user_id_val,
            invitation_data.first_name,
            invitation_data.last_name,
            invitation_data.email,
            'customer',
            shop_id_val,
            now(),
            now()
        );
        RAISE NOTICE 'Created profile for user %', user_id_val;
    ELSE
        RAISE NOTICE 'Profile already exists for user %', user_id_val;
    END IF;

    -- Check if customer record already exists
    IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = user_id_val) THEN
        -- Create the customer record
        INSERT INTO public.customers (
            id,
            shop_id,
            first_name,
            last_name,
            email,
            phone,
            customer_type,
            date_of_birth,
            age_verified,
            created_at,
            updated_at
        ) VALUES (
            user_id_val,
            shop_id_val,
            invitation_data.first_name,
            invitation_data.last_name,
            invitation_data.email,
            invitation_data.phone,
            COALESCE(invitation_data.customer_type, 'regular'),
            invitation_data.date_of_birth,
            invitation_data.age_verified,
            now(),
            now()
        );
        RAISE NOTICE 'Created customer record for user %', user_id_val;
    ELSE
        RAISE NOTICE 'Customer record already exists for user %', user_id_val;
    END IF;

    RAISE NOTICE 'Profile creation completed successfully for %', invitation_data.email;
END $$;

-- Verify the fix worked
SELECT 
    'Verification' as check_type,
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.role,
    p.shop_id,
    c.customer_type,
    c.phone
FROM public.profiles p
LEFT JOIN public.customers c ON p.id = c.id
WHERE p.email = 'chridonpa@gmail.com';

-- Test that the user can now authenticate
SELECT 'Manual profile fix completed. User should now be able to sign in.' as status;
