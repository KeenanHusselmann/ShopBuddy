-- Create shop_customer_invitations table for customer invitation system
CREATE TABLE IF NOT EXISTS public.shop_customer_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    customer_type TEXT DEFAULT 'regular' CHECK (customer_type IN ('regular', 'vip', 'wholesale')),
    phone TEXT,
    date_of_birth DATE,
    age_verified BOOLEAN DEFAULT false,
    invitation_token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shop_customer_invitations_shop_id ON public.shop_customer_invitations(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_customer_invitations_email ON public.shop_customer_invitations(email);
CREATE INDEX IF NOT EXISTS idx_shop_customer_invitations_status ON public.shop_customer_invitations(status);
CREATE INDEX IF NOT EXISTS idx_shop_customer_invitations_token ON public.shop_customer_invitations(invitation_token);

-- Enable Row Level Security
ALTER TABLE public.shop_customer_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Shop owners can manage their customer invitations" ON public.shop_customer_invitations
    FOR ALL USING (shop_id IN (
        SELECT shop_id FROM public.profiles 
        WHERE id = auth.uid() AND role = 'shop_admin'
    ));

CREATE POLICY "Staff can view customer invitations for their shop" ON public.shop_customer_invitations
    FOR SELECT USING (shop_id IN (
        SELECT shop_id FROM public.profiles 
        WHERE id = auth.uid() AND shop_id IS NOT NULL
    ));

-- Create function to generate invitation token
CREATE OR REPLACE FUNCTION public.generate_customer_invitation_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to accept customer invitation
CREATE OR REPLACE FUNCTION public.accept_customer_invitation(
    invitation_token_param TEXT,
    password_param TEXT
)
RETURNS JSONB AS $$
DECLARE
    invitation_data RECORD;
    new_customer_id UUID;
BEGIN
    -- Get invitation data
    SELECT * INTO invitation_data
    FROM public.shop_customer_invitations
    WHERE invitation_token = invitation_token_param
    AND status = 'pending'
    AND expires_at > now();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation token');
    END IF;

    -- Check if customer already exists
    IF EXISTS (SELECT 1 FROM public.customers WHERE shop_id = invitation_data.shop_id AND email = invitation_data.email) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Customer already exists with this email');
    END IF;

    -- Create customer profile
    INSERT INTO public.customers (
        shop_id, first_name, last_name, email, phone, date_of_birth, customer_type
    ) VALUES (
        invitation_data.shop_id, invitation_data.first_name, invitation_data.last_name,
        invitation_data.email, invitation_data.phone, invitation_data.date_of_birth, invitation_data.customer_type
    ) RETURNING id INTO new_customer_id;

    -- Update invitation status
    UPDATE public.shop_customer_invitations
    SET status = 'accepted', accepted_at = now()
    WHERE id = invitation_data.id;

    -- Log the activity
    INSERT INTO public.activity_logs (
        shop_id, user_id, action, table_name, record_id, new_values, metadata
    ) VALUES (
        invitation_data.shop_id, invitation_data.created_by,
        'customer_invitation_accepted', 'customers', new_customer_id,
        jsonb_build_object('customer_id', new_customer_id),
        jsonb_build_object('invitation_id', invitation_data.id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'customer_id', new_customer_id,
        'message', 'Customer invitation accepted successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.shop_customer_invitations TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_customer_invitation_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_customer_invitation(TEXT, TEXT) TO authenticated;
