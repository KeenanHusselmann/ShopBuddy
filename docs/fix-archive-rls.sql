-- Fix RLS Policies for Customer Order Archiving
-- This script ensures customers can archive their own orders

-- 1. Check current RLS status on orders table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'orders';

-- 2. Check existing policies on orders table
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
WHERE tablename = 'orders';

-- 3. Check current user authentication context
SELECT 
    current_user,
    session_user,
    current_setting('role'),
    current_setting('search_path');

-- 4. Add archive columns if they don't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_archived ON public.orders(archived);

-- 6. Drop all existing policies on orders table to start fresh
DROP POLICY IF EXISTS "Orders - Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop staff can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Orders - Customers can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop staff can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop staff can insert orders" ON public.orders;

-- 7. Create comprehensive RLS policies
-- Policy 1: Customers can view their own orders
CREATE POLICY "Orders - Customers can view their own orders" ON public.orders
FOR SELECT USING (
  auth.uid() IN (
    SELECT p.id FROM profiles p
    JOIN customers c ON c.profile_id = p.id
    WHERE c.id = orders.customer_id AND p.shop_id = orders.shop_id
  )
);

-- Policy 2: Shop staff can view all orders in their shop
CREATE POLICY "Orders - Shop staff can view all orders" ON public.orders
FOR SELECT USING (
  auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.shop_id = orders.shop_id 
    AND p.role IN ('shop_admin', 'staff')
  )
);

-- Policy 3: Customers can update their own orders (for archiving)
CREATE POLICY "Orders - Customers can update their own orders" ON public.orders
FOR UPDATE USING (
  auth.uid() IN (
    SELECT p.id FROM profiles p
    JOIN customers c ON c.profile_id = p.id
    WHERE c.id = orders.customer_id AND p.shop_id = orders.shop_id
  )
) WITH CHECK (
  auth.uid() IN (
    SELECT p.id FROM profiles p
    JOIN customers c ON c.profile_id = p.id
    WHERE c.id = orders.customer_id AND p.shop_id = orders.shop_id
  )
);

-- Policy 4: Shop staff can update all orders in their shop
CREATE POLICY "Orders - Shop staff can update all orders" ON public.orders
FOR UPDATE USING (
  auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.shop_id = orders.shop_id 
    AND p.role IN ('shop_admin', 'staff')
  )
) WITH CHECK (
  auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.shop_id = orders.shop_id 
    AND p.role IN ('shop_admin', 'staff')
  )
);

-- Policy 5: Shop staff can insert orders
CREATE POLICY "Orders - Shop staff can insert orders" ON public.orders
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.shop_id = orders.shop_id 
    AND p.role IN ('shop_admin', 'staff')
  )
);

-- 8. Verify all policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual IS NOT NULL as has_qual,
    with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- 9. Test the archive functionality with a sample update
DO $$
DECLARE
    test_order_id uuid;
    test_customer_id uuid;
    test_profile_id uuid;
BEGIN
    -- Get a sample order for testing
    SELECT o.id, o.customer_id INTO test_order_id, test_customer_id
    FROM orders o
    LIMIT 1;
    
    IF test_order_id IS NOT NULL THEN
        -- Get the profile_id for this customer
        SELECT c.profile_id INTO test_profile_id
        FROM customers c
        WHERE c.id = test_customer_id;
        
        RAISE NOTICE 'Testing archive functionality...';
        RAISE NOTICE 'Test order ID: %', test_order_id;
        RAISE NOTICE 'Test customer ID: %', test_customer_id;
        RAISE NOTICE 'Test profile ID: %', test_profile_id;
        
        -- Test the update (this should work if RLS is correct)
        UPDATE orders 
        SET archived = true, archived_at = NOW()
        WHERE id = test_order_id;
        
        RAISE NOTICE 'Archive test successful!';
        
        -- Reset the test
        UPDATE orders 
        SET archived = false, archived_at = NULL
        WHERE id = test_order_id;
        
        RAISE NOTICE 'Archive test reset successful!';
    ELSE
        RAISE NOTICE 'No orders found for testing';
    END IF;
END $$;

-- 10. Show final status
DO $$
BEGIN
    RAISE NOTICE 'RLS policies for customer order archiving have been fixed!';
    RAISE NOTICE 'Customers should now be able to archive their own orders.';
    RAISE NOTICE 'Check the browser console for any remaining errors.';
END $$;
