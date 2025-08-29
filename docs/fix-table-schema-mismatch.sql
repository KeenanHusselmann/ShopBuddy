-- Fix for Table Schema Mismatch in shop_customer_invitations
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- First, let's see the current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shop_customer_invitations'
ORDER BY ordinal_position;

-- The issue: Your table has 'invited_by' but the application expects 'created_by'
-- Let's fix this by adding the missing 'created_by' column and making 'invited_by' nullable

-- Add created_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shop_customer_invitations' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.shop_customer_invitations ADD COLUMN created_by UUID REFERENCES public.profiles(id);
        RAISE NOTICE 'Added created_by column to shop_customer_invitations table';
    ELSE
        RAISE NOTICE 'created_by column already exists';
    END IF;
END $$;

-- Make invited_by column nullable since it's not being used by the application
ALTER TABLE public.shop_customer_invitations ALTER COLUMN invited_by DROP NOT NULL;

-- Update the RLS policies to use the correct column names
DROP POLICY IF EXISTS "Shop owners can manage their customer invitations" ON public.shop_customer_invitations;
DROP POLICY IF EXISTS "Staff can view customer invitations for their shop" ON public.shop_customer_invitations;

-- Create RLS policies using the correct column names
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

-- Final verification - show the complete table structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shop_customer_invitations'
ORDER BY ordinal_position;

-- Test that all required columns are accessible
SELECT 
    'Schema verification complete' as status,
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name IN ('id', 'shop_id', 'email', 'first_name', 'last_name', 'customer_type', 'phone', 'date_of_birth', 'age_verified', 'invitation_token', 'status', 'expires_at', 'created_by', 'created_at', 'updated_at') THEN 1 END) as required_columns_present
FROM information_schema.columns 
WHERE table_name = 'shop_customer_invitations';


