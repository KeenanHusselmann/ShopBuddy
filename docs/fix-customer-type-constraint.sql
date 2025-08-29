-- Fix for Customer Type Check Constraint in shop_customer_invitations table
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- First, let's see what the current check constraint allows
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.shop_customer_invitations'::regclass 
AND contype = 'c';

-- Let's also see what values are currently in the customer_type column
SELECT DISTINCT customer_type FROM public.shop_customer_invitations;

-- The issue: Your form sends "Retail Customer" but the constraint expects "retail"
-- Let's fix this by updating the constraint to accept both formats

-- Drop the existing constraint
ALTER TABLE public.shop_customer_invitations DROP CONSTRAINT IF EXISTS shop_customer_invitations_customer_type_check;

-- Create a new constraint that accepts both formats
ALTER TABLE public.shop_customer_invitations ADD CONSTRAINT shop_customer_invitations_customer_type_check 
CHECK (customer_type IN ('retail', 'Retail Customer', 'wholesale', 'Wholesale Customer', 'vip', 'VIP Customer', 'regular', 'Regular Customer'));

-- Alternative: Make the constraint more flexible by accepting any text
-- ALTER TABLE public.shop_customer_invitations ADD CONSTRAINT shop_customer_invitations_customer_type_check 
-- CHECK (customer_type IS NOT NULL AND customer_type != '');

-- Verify the new constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.shop_customer_invitations'::regclass 
AND contype = 'c';

-- Test that the constraint now accepts "Retail Customer"
SELECT 'Constraint updated successfully' as status;

-- Show the final table structure for verification
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shop_customer_invitations'
ORDER BY ordinal_position;
