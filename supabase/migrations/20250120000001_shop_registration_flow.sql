-- Shop Registration Flow Implementation
-- This migration adds proper shop registration logic

-- Add shop registration status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shop_registration_status TEXT DEFAULT 'pending' CHECK (shop_registration_status IN ('pending', 'completed', 'rejected'));

-- Add shop verification fields
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_document_url TEXT,
ADD COLUMN IF NOT EXISTS business_license_number TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS registration_date DATE,                                                   
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive', 'pending_verification'));

-- Create shop registration requests table
CREATE TABLE IF NOT EXISTS public.shop_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    shop_name TEXT NOT NULL,
    shop_description TEXT,
    business_address JSONB NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    business_license_number TEXT,
    tax_id TEXT,
    business_type TEXT,
    expected_monthly_revenue DECIMAL(12,2),
    number_of_employees INTEGER,
    business_hours JSONB,
    services_offered TEXT[],
    compliance_documents JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for shop registration requests
ALTER TABLE public.shop_registration_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shop registration requests
CREATE POLICY "Users can view their own registration requests" ON public.shop_registration_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own registration requests" ON public.shop_registration_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own registration requests" ON public.shop_registration_requests
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Admin policies for shop registration requests
CREATE POLICY "Admins can view all registration requests" ON public.shop_registration_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Admins can update all registration requests" ON public.shop_registration_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Create function to handle shop approval
CREATE OR REPLACE FUNCTION public.approve_shop_registration(
    request_id UUID,
    admin_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_data RECORD;
    new_shop_id UUID;
    result JSONB;
BEGIN
    -- Get the registration request
    SELECT * INTO request_data 
    FROM public.shop_registration_requests 
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registration request not found or already processed');
    END IF;
    
    -- Create the shop
    INSERT INTO public.shops (
        id, name, description, address, phone, email, 
        business_license_number, tax_id, registration_date,
        is_verified, status, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), request_data.shop_name, request_data.shop_description,
        request_data.business_address, request_data.contact_phone, request_data.contact_email,
        request_data.business_license_number, request_data.tax_id, CURRENT_DATE,
        true, 'active', now(), now()
    ) RETURNING id INTO new_shop_id;
    
    -- Update the user profile
    UPDATE public.profiles 
    SET 
        shop_id = new_shop_id,
        shop_registration_status = 'completed',
        updated_at = now()
    WHERE id = request_data.user_id;
    
    -- Update the registration request
    UPDATE public.shop_registration_requests 
    SET 
        status = 'approved',
        reviewed_by = admin_user_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = request_id;
    
    -- Create audit log
    INSERT INTO public.audit_logs (
        shop_id, user_id, user_name, user_role, action, 
        table_name, record_id, new_values, metadata
    ) VALUES (
        new_shop_id, admin_user_id, 
        (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = admin_user_id),
        'super_admin', 'shop_approved', 'shop_registration_requests', 
        request_id, jsonb_build_object('shop_id', new_shop_id), 
        jsonb_build_object('request_id', request_id)
    );
    
    RETURN jsonb_build_object(
        'success', true, 
        'shop_id', new_shop_id,
        'message', 'Shop registration approved successfully'
    );
END;
$$;

-- Create function to reject shop registration
CREATE OR REPLACE FUNCTION public.reject_shop_registration(
    request_id UUID,
    admin_user_id UUID,
    rejection_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_data RECORD;
    result JSONB;
BEGIN
    -- Get the registration request
    SELECT * INTO request_data 
    FROM public.shop_registration_requests 
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registration request not found or already processed');
    END IF;
    
    -- Update the registration request
    UPDATE public.shop_registration_requests 
    SET 
        status = 'rejected',
        admin_notes = rejection_reason,
        reviewed_by = admin_user_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = request_id;
    
    -- Update user profile status
    UPDATE public.profiles 
    SET 
        shop_registration_status = 'rejected',
        updated_at = now()
    WHERE id = request_data.user_id;
    
    -- Create audit log
    INSERT INTO public.audit_logs (
        shop_id, user_id, user_name, user_role, action, 
        table_name, record_id, new_values, metadata
    ) VALUES (
        NULL, admin_user_id, 
        (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = admin_user_id),
        'super_admin', 'shop_rejected', 'shop_registration_requests', 
        request_id, jsonb_build_object('status', 'rejected', 'reason', rejection_reason), 
        jsonb_build_object('request_id', request_id)
    );
    
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Shop registration rejected successfully'
    );
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shop_registration_requests_user_id ON public.shop_registration_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_registration_requests_status ON public.shop_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_shop_registration_requests_created_at ON public.shop_registration_requests(created_at);

-- Update the existing profiles table to handle shop registration flow
UPDATE public.profiles 
SET shop_registration_status = 'completed' 
WHERE shop_id IS NOT NULL;

UPDATE public.profiles 
SET shop_registration_status = 'pending' 
WHERE shop_id IS NULL AND role IN ('shop_admin', 'staff');

-- Create trigger for updated_at on shop_registration_requests
CREATE TRIGGER update_shop_registration_requests_updated_at 
    BEFORE UPDATE ON public.shop_registration_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
