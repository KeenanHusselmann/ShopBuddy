-- Check Database State - Diagnostic Script
-- Run this to see what's currently in your database

-- 1. Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('customers', 'customer_cart', 'orders', 'order_items', 'profiles', 'shops')
ORDER BY table_name;

-- 2. Check customers table structure (if it exists)
DO $$
DECLARE
    r RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        RAISE NOTICE 'Customers table exists. Checking structure...';
        
        -- Show columns
        FOR r IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'customers' 
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: % - Type: % - Nullable: % - Default: %', 
                r.column_name, r.data_type, r.is_nullable, r.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'Customers table does NOT exist!';
    END IF;
END $$;

-- 3. Check customer_cart table structure (if it exists)
DO $$
DECLARE
    r RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_cart') THEN
        RAISE NOTICE 'Customer_cart table exists. Checking structure...';
        
        -- Show columns
        FOR r IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'customer_cart' 
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: % - Type: % - Nullable: % - Default: %', 
                r.column_name, r.data_type, r.is_nullable, r.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'Customer_cart table does NOT exist!';
    END IF;
END $$;

-- 4. Check orders table structure (if it exists)
DO $$
DECLARE
    r RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        RAISE NOTICE 'Orders table exists. Checking structure...';
        
        -- Show columns
        FOR r IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: % - Type: % - Nullable: % - Default: %', 
                r.column_name, r.data_type, r.is_nullable, r.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'Orders table does NOT exist!';
    END IF;
END $$;

-- 5. Check existing policies
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
WHERE tablename IN ('customers', 'customer_cart', 'orders')
ORDER BY tablename, policyname;

-- 6. Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('customers', 'customer_cart', 'orders')
ORDER BY tablename;

-- 7. Check sample data in customers table (if it exists)
DO $$
DECLARE
    r RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        RAISE NOTICE 'Sample customers data:';
        FOR r IN SELECT * FROM customers LIMIT 3 LOOP
            RAISE NOTICE 'Customer: %', r;
        END LOOP;
    END IF;
END $$;

-- 8. Check sample data in profiles table (if it exists)
DO $$
DECLARE
    r RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE 'Sample profiles data:';
        FOR r IN SELECT id, first_name, last_name, email, role, shop_id FROM profiles LIMIT 3 LOOP
            RAISE NOTICE 'Profile: %', r;
        END LOOP;
    END IF;
END $$;
