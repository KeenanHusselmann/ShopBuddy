-- Complete Fix for Customer Invitation System
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- Step 1: Fix the customer_type check constraint
-- Drop the existing restrictive constraint
ALTER TABLE public.shop_customer_invitations DROP CONSTRAINT IF EXISTS shop_customer_invitations_customer_type_check;

-- Create a new flexible constraint that accepts both formats
ALTER TABLE public.shop_customer_invitations ADD CONSTRAINT shop_customer_invitations_customer_type_check 
CHECK (customer_type IN ('retail', 'Retail Customer', 'wholesale', 'Wholesale Customer', 'vip', 'VIP Customer', 'regular', 'Regular Customer'));

-- Step 2: Ensure all required columns exist and are properly configured
-- Add created_by column if it doesn't exist (for tracking who created the invitation)
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

-- Step 3: Update RLS policies for proper access control
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

-- Step 4: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.shop_customer_invitations TO authenticated;

-- Step 5: Verify the final table structure
SELECT 
    'Final table structure verification' as status,
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name IN ('id', 'shop_id', 'email', 'first_name', 'last_name', 'customer_type', 'phone', 'date_of_birth', 'age_verified', 'invitation_token', 'status', 'expires_at', 'created_by', 'created_at', 'updated_at') THEN 1 END) as required_columns_present
FROM information_schema.columns 
WHERE table_name = 'shop_customer_invitations';

-- Step 6: Show the complete table structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shop_customer_invitations'
ORDER BY ordinal_position;

-- Step 7: Verify the new constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.shop_customer_invitations'::regclass 
AND contype = 'c';

-- Step 8: Test that the system is ready
SELECT 'Customer invitation system is now ready!' as status;
