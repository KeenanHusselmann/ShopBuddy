-- Fix for Missing date_of_birth column in shop_customer_invitations table
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- First, let's see what columns actually exist in the table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shop_customer_invitations'
ORDER BY ordinal_position;

-- Check if the date_of_birth column exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_customer_invitations' 
    AND column_name = 'date_of_birth'
) as date_of_birth_exists;

-- If date_of_birth column doesn't exist, add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shop_customer_invitations' 
        AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE public.shop_customer_invitations ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Added date_of_birth column to shop_customer_invitations table';
    ELSE
        RAISE NOTICE 'date_of_birth column already exists';
    END IF;
END $$;

-- Let's also verify all the required columns exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'id') THEN '✅ id'
        ELSE '❌ id'
    END as id_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'shop_id') THEN '✅ shop_id'
        ELSE '❌ shop_id'
    END as shop_id_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'email') THEN '✅ email'
        ELSE '❌ email'
    END as email_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'first_name') THEN '✅ first_name'
        ELSE '❌ first_name'
    END as first_name_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'last_name') THEN '✅ last_name'
        ELSE '❌ last_name'
    END as last_name_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'customer_type') THEN '✅ customer_type'
        ELSE '❌ customer_type'
    END as customer_type_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'phone') THEN '✅ phone'
        ELSE '❌ phone'
    END as phone_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'date_of_birth') THEN '✅ date_of_birth'
        ELSE '❌ date_of_birth'
    END as date_of_birth_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'age_verified') THEN '✅ age_verified'
        ELSE '❌ age_verified'
    END as age_verified_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'invitation_token') THEN '✅ invitation_token'
        ELSE '❌ invitation_token'
    END as invitation_token_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'status') THEN '✅ status'
        ELSE '❌ status'
    END as status_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'expires_at') THEN '✅ expires_at'
        ELSE '❌ expires_at'
    END as expires_at_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'accepted_at') THEN '✅ accepted_at'
        ELSE '❌ accepted_at'
    END as accepted_at_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'created_by') THEN '✅ created_by'
        ELSE '❌ created_by'
    END as created_by_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'created_at') THEN '✅ created_at'
        ELSE '❌ created_at'
    END as created_at_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_customer_invitations' AND column_name = 'updated_at') THEN '✅ updated_at'
        ELSE '❌ updated_at'
    END as updated_at_column;

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


