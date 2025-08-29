-- Create staff_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  permissions JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES public.profiles(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_invitations_shop_id ON public.staff_invitations(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_email ON public.staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_token ON public.staff_invitations(token);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_status ON public.staff_invitations(status);

-- Enable RLS
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_invitations
CREATE POLICY "Shop owners can view their staff invitations" ON public.staff_invitations
  FOR SELECT USING (
    shop_id IN (
      SELECT shop_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'shop_admin'
    )
  );

CREATE POLICY "Shop owners can create staff invitations" ON public.staff_invitations
  FOR INSERT WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'shop_admin'
    )
  );

CREATE POLICY "Shop owners can update their staff invitations" ON public.staff_invitations
  FOR UPDATE USING (
    shop_id IN (
      SELECT shop_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'shop_admin'
    )
  );

-- Create the invite_staff_member function
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
  invitation_token TEXT;
  invitation_id UUID;
  result JSONB;
BEGIN
  -- Check if user has permission to invite staff
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND shop_id = shop_id_param 
    AND role = 'shop_admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied. Only shop owners can invite staff members.'
    );
  END IF;

  -- Check if email already has a pending invitation
  IF EXISTS (
    SELECT 1 FROM public.staff_invitations 
    WHERE email = email_param 
    AND shop_id = shop_id_param 
    AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'An invitation for this email is already pending.'
    );
  END IF;

  -- Check if user already exists in this shop
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = email_param 
    AND shop_id = shop_id_param
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'A user with this email already exists in your shop.'
    );
  END IF;

  -- Generate unique invitation token
  invitation_token := encode(gen_random_bytes(32), 'hex');
  
  -- Create invitation
  INSERT INTO public.staff_invitations (
    shop_id,
    email,
    first_name,
    last_name,
    role,
    permissions,
    token,
    expires_at
  ) VALUES (
    shop_id_param,
    email_param,
    first_name_param,
    last_name_param,
    role_param,
    permissions_param,
    invitation_token,
    NOW() + INTERVAL '7 days'
  ) RETURNING id INTO invitation_id;

  -- TODO: Send email invitation (this would be handled by your email service)
  -- For now, we'll just return success
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', invitation_id,
    'token', invitation_token,
    'message', 'Staff invitation created successfully. Email functionality needs to be implemented.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to create staff invitation: ' || SQLERRM
    );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.invite_staff_member(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- Create function to accept staff invitation
CREATE OR REPLACE FUNCTION public.accept_staff_invitation(
  token_param TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  new_profile_id UUID;
  result JSONB;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_record 
  FROM public.staff_invitations 
  WHERE token = token_param 
  AND status = 'pending'
  AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired invitation token.'
    );
  END IF;

  -- Create profile for the new staff member
  INSERT INTO public.profiles (
    first_name,
    last_name,
    email,
    role,
    shop_id
  ) VALUES (
    invitation_record.first_name,
    invitation_record.last_name,
    invitation_record.email,
    invitation_record.role,
    invitation_record.shop_id
  ) RETURNING id INTO new_profile_id;

  -- Update invitation status
  UPDATE public.staff_invitations 
  SET status = 'accepted', accepted_at = NOW(), accepted_by = auth.uid()
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'profile_id', new_profile_id,
    'message', 'Staff invitation accepted successfully.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to accept invitation: ' || SQLERRM
    );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.accept_staff_invitation(TEXT) TO authenticated;

-- Create function to get staff invitation by token
CREATE OR REPLACE FUNCTION public.get_staff_invitation(
  token_param TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  SELECT * INTO invitation_record 
  FROM public.staff_invitations 
  WHERE token = token_param 
  AND status = 'pending'
  AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired invitation token.'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'invitation', to_jsonb(invitation_record)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to get invitation: ' || SQLERRM
    );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_staff_invitation(TEXT) TO authenticated;
