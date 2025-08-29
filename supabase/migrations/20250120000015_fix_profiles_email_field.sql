-- Fix profiles table to include email field
-- This is needed for the staff invitation system to work properly

-- Add email field to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
        
        -- Create index for email lookups
        CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
        
        -- Add unique constraint for email within shop (optional, depending on your business logic)
        -- ALTER TABLE public.profiles ADD CONSTRAINT unique_email_per_shop UNIQUE (shop_id, email);
    END IF;
END $$;

-- Update the invite_staff_member function to handle the email field correctly
CREATE OR REPLACE FUNCTION public.invite_staff_member(
    shop_id_param UUID,
    email_param TEXT,
    first_name_param TEXT,
    last_name_param TEXT,
    role_param TEXT DEFAULT 'staff',
    permissions_param JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_id UUID;
    invitation_token TEXT;
    result JSONB;
BEGIN
    -- Check if user is shop admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND shop_id = shop_id_param 
        AND role = 'shop_admin'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only shop owners can invite staff members');
    END IF;

    -- Check if email already has a pending invitation
    IF EXISTS (
        SELECT 1 FROM public.staff_invitations 
        WHERE email = email_param AND shop_id = shop_id_param AND status = 'pending'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Staff invitation already sent to this email');
    END IF;

    -- Check if user already exists in this shop
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE email = email_param AND shop_id = shop_id_param
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'A user with this email already exists in your shop');
    END IF;

    -- Generate invitation token
    invitation_token := encode(gen_random_bytes(32), 'hex');

    -- Create invitation
    INSERT INTO public.staff_invitations (
        shop_id, invited_by, email, first_name, last_name, 
        role, permissions, invitation_token
    ) VALUES (
        shop_id_param, auth.uid(), email_param, first_name_param, 
        last_name_param, role_param, permissions_param, invitation_token
    ) RETURNING id INTO invitation_id;

    -- Create audit log
    INSERT INTO public.audit_logs (
        shop_id, user_id, user_name, user_role, action, 
        table_name, record_id, new_values, metadata
    ) VALUES (
        shop_id_param, auth.uid(), 
        (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = auth.uid()),
        'shop_admin', 'staff_invited', 'staff_invitations', 
        invitation_id, jsonb_build_object('email', email_param, 'role', role_param), 
        jsonb_build_object('invitation_id', invitation_id)
    );

    RETURN jsonb_build_object(
        'success', true, 
        'invitation_id', invitation_id,
        'invitation_token', invitation_token,
        'message', 'Staff invitation sent successfully'
    );
END;
$$;

-- Update the accept_staff_invitation function to handle the email field correctly
CREATE OR REPLACE FUNCTION public.accept_staff_invitation(
    invitation_token_param TEXT,
    password_param TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_data RECORD;
    new_profile_id UUID;
    new_staff_credentials_id UUID;
BEGIN
    -- Get invitation data
    SELECT * INTO invitation_data 
    FROM public.staff_invitations 
    WHERE invitation_token = invitation_token_param 
    AND status = 'pending' 
    AND expires_at > now();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation token');
    END IF;

    -- Create new profile for staff member
    INSERT INTO public.profiles (
        id, shop_id, first_name, last_name, email, role, 
        created_at, updated_at
    ) VALUES (
        gen_random_uuid(), invitation_data.shop_id, invitation_data.first_name, 
        invitation_data.last_name, invitation_data.email, invitation_data.role,
        now(), now()
    ) RETURNING id INTO new_profile_id;

    -- Create staff credentials
    INSERT INTO public.staff_credentials (
        staff_id, email, password_hash
    ) VALUES (
        new_profile_id, invitation_data.email, crypt(password_param, gen_salt('bf'))
    ) RETURNING id INTO new_staff_credentials_id;

    -- Update invitation status
    UPDATE public.staff_invitations 
    SET status = 'accepted', accepted_at = now(), accepted_by = new_profile_id
    WHERE id = invitation_data.id;

    -- Create audit log
    INSERT INTO public.audit_logs (
        shop_id, user_id, user_name, user_role, action, 
        table_name, record_id, new_values, metadata
    ) VALUES (
        invitation_data.shop_id, new_profile_id, 
        invitation_data.first_name || ' ' || invitation_data.last_name,
        invitation_data.role, 'staff_joined', 'profiles', 
        new_profile_id, jsonb_build_object('role', invitation_data.role), 
        jsonb_build_object('invitation_id', invitation_data.id)
    );

    RETURN jsonb_build_object(
        'success', true, 
        'profile_id', new_profile_id,
        'message', 'Staff account created successfully'
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.invite_staff_member(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_staff_invitation(TEXT, TEXT) TO authenticated;
