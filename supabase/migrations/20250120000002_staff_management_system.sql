-- Staff Management System and Customer Portal Implementation
-- Migration: 20250120000002_staff_management_system.sql

-- Create staff_invitations table for shop owners to invite staff
CREATE TABLE IF NOT EXISTS public.staff_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'assistant_manager')),
    permissions JSONB DEFAULT '{}',
    invitation_token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create staff_credentials table for staff login credentials
CREATE TABLE IF NOT EXISTS public.staff_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customer_accounts table for public customer signup
CREATE TABLE IF NOT EXISTS public.customer_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    address JSONB,
    date_of_birth DATE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_login TIMESTAMP WITH TIME ZONE,
    UNIQUE(shop_id, email)
);

-- Create customer_profiles table for additional customer information
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customer_accounts(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}',
    loyalty_points INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    favorite_categories TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customer_orders table for customer order history
CREATE TABLE IF NOT EXISTS public.customer_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customer_accounts(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    items JSONB NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customer_debt table for tracking customer debt
CREATE TABLE IF NOT EXISTS public.customer_debt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customer_accounts(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    debt_type TEXT NOT NULL CHECK (debt_type IN ('credit', 'installment', 'overdue')),
    due_date DATE,
    interest_rate DECIMAL(5,2) DEFAULT 0.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue', 'defaulted')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customer_spending_habits table for analytics
CREATE TABLE IF NOT EXISTS public.customer_spending_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customer_accounts(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    order_count INTEGER DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0.00,
    favorite_products TEXT[],
    spending_pattern JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(customer_id, month_year)
);

-- Add RLS policies for staff_invitations
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage their staff invitations" ON public.staff_invitations
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'shop_admin'
        )
    );

CREATE POLICY "Staff can view their own invitations" ON public.staff_invitations
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Add RLS policies for staff_credentials
ALTER TABLE public.staff_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage their own credentials" ON public.staff_credentials
    FOR ALL USING (
        staff_id = auth.uid()
    );

CREATE POLICY "Shop owners can view staff credentials" ON public.staff_credentials
    FOR SELECT USING (
        staff_id IN (
            SELECT id FROM public.profiles
            WHERE shop_id IN (
                SELECT shop_id FROM public.profiles
                WHERE id = auth.uid() AND role = 'shop_admin'
            )
        )
    );

-- Add RLS policies for customer_accounts
ALTER TABLE public.customer_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can manage their own accounts" ON public.customer_accounts
    FOR ALL USING (
        id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Shop owners can view their customers" ON public.customer_accounts
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Add RLS policies for customer_profiles
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own profiles" ON public.customer_profiles
    FOR SELECT USING (
        customer_id = auth.uid()
    );

CREATE POLICY "Shop owners can view customer profiles" ON public.customer_profiles
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM public.customer_accounts
            WHERE shop_id IN (
                SELECT shop_id FROM public.profiles
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

-- Add RLS policies for customer_orders
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own orders" ON public.customer_orders
    FOR SELECT USING (
        customer_id = auth.uid()
    );

CREATE POLICY "Shop owners can manage customer orders" ON public.customer_orders
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Add RLS policies for customer_debt
ALTER TABLE public.customer_debt ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own debt" ON public.customer_debt
    FOR SELECT USING (
        customer_id = auth.uid()
    );

CREATE POLICY "Shop owners can manage customer debt" ON public.customer_debt
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Add RLS policies for customer_spending_habits
ALTER TABLE public.customer_spending_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own spending habits" ON public.customer_spending_habits
    FOR SELECT USING (
        customer_id = auth.uid()
    );

CREATE POLICY "Shop owners can view customer spending habits" ON public.customer_spending_habits
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM public.customer_accounts
            WHERE shop_id IN (
                SELECT shop_id FROM public.profiles
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

-- Create function to invite staff member
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

    -- Check if email already exists
    IF EXISTS (
        SELECT 1 FROM public.staff_invitations 
        WHERE email = email_param AND shop_id = shop_id_param AND status = 'pending'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Staff invitation already sent to this email');
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

-- Create function to accept staff invitation
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
        shop_registration_status, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), invitation_data.shop_id, invitation_data.first_name, 
        invitation_data.last_name, invitation_data.email, invitation_data.role,
        'completed', now(), now()
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

-- Create function to create customer account
CREATE OR REPLACE FUNCTION public.create_customer_account(
    shop_id_param UUID,
    email_param TEXT,
    password_param TEXT,
    first_name_param TEXT,
    last_name_param TEXT,
    phone_param TEXT DEFAULT NULL,
    address_param JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_customer_id UUID;
    new_profile_id UUID;
    verification_token TEXT;
BEGIN
    -- Check if email already exists for this shop
    IF EXISTS (
        SELECT 1 FROM public.customer_accounts 
        WHERE email = email_param AND shop_id = shop_id_param
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Customer account already exists with this email');
    END IF;

    -- Generate verification token
    verification_token := encode(gen_random_bytes(32), 'hex');

    -- Create customer account
    INSERT INTO public.customer_accounts (
        shop_id, email, password_hash, first_name, last_name, 
        phone, address, verification_token, verification_expires_at
    ) VALUES (
        shop_id_param, email_param, crypt(password_param, gen_salt('bf')), 
        first_name_param, last_name_param, phone_param, address_param,
        verification_token, now() + interval '24 hours'
    ) RETURNING id INTO new_customer_id;

    -- Create customer profile
    INSERT INTO public.customer_profiles (customer_id) VALUES (new_customer_id);

    -- Create audit log
    INSERT INTO public.audit_logs (
        shop_id, user_id, user_name, user_role, action, 
        table_name, record_id, new_values, metadata
    ) VALUES (
        shop_id_param, NULL, 'System', 'system', 'customer_created', 'customer_accounts', 
        new_customer_id, jsonb_build_object('email', email_param), 
        jsonb_build_object('customer_id', new_customer_id)
    );

    RETURN jsonb_build_object(
        'success', true, 
        'customer_id', new_customer_id,
        'verification_token', verification_token,
        'message', 'Customer account created successfully'
    );
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_invitations_shop_id ON public.staff_invitations(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_email ON public.staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_status ON public.staff_invitations(status);
CREATE INDEX IF NOT EXISTS idx_staff_credentials_staff_id ON public.staff_credentials(staff_id);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_shop_id ON public.customer_accounts(shop_id);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_email ON public.customer_accounts(email);
CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_id ON public.customer_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_shop_id ON public.customer_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_customer_debt_customer_id ON public.customer_debt(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_spending_habits_customer_id ON public.customer_spending_habits(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_spending_habits_month_year ON public.customer_spending_habits(month_year);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
