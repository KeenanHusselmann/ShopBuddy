-- Fix for Customer Management Error: Missing shop_customer_invitations table
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- First, let's check what roles exist in your database
SELECT unnest(enum_range(NULL::user_role)) as valid_roles;

-- Create shop_customer_invitations table for customer invitation system
CREATE TABLE IF NOT EXISTS public.shop_customer_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    customer_type TEXT DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale', 'vip')),
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

-- Create RLS policies (using correct role: 'shop_admin' not 'shop_owner')
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.shop_customer_invitations TO authenticated;

-- Verify the table was created successfully
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'shop_customer_invitations'
ORDER BY ordinal_position;

-- Test the RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'shop_customer_invitations';
