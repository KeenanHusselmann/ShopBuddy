-- Quick Fix for Customer Management Error: Missing age_verified column
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- First, check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'shop_customer_invitations'
) as table_exists;

-- If the table doesn't exist, create it
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

-- If the table exists but is missing the age_verified column, add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shop_customer_invitations' AND column_name = 'age_verified'
    ) THEN
        ALTER TABLE public.shop_customer_invitations ADD COLUMN age_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added age_verified column to shop_customer_invitations table';
    ELSE
        RAISE NOTICE 'age_verified column already exists';
    END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_shop_customer_invitations_shop_id ON public.shop_customer_invitations(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_customer_invitations_email ON public.shop_customer_invitations(email);
CREATE INDEX IF NOT EXISTS idx_shop_customer_invitations_status ON public.shop_customer_invitations(status);
CREATE INDEX IF NOT EXISTS idx_shop_customer_invitations_token ON public.shop_customer_invitations(invitation_token);

-- Enable Row Level Security
ALTER TABLE public.shop_customer_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Shop owners can manage their customer invitations" ON public.shop_customer_invitations;
DROP POLICY IF EXISTS "Staff can view customer invitations for their shop" ON public.shop_customer_invitations;

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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.shop_customer_invitations TO authenticated;

-- Verify the table structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shop_customer_invitations'
ORDER BY ordinal_position;

-- Test that the age_verified column is accessible
SELECT 
    'age_verified column exists' as status,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shop_customer_invitations' 
AND column_name = 'age_verified';
