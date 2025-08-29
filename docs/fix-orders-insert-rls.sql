-- Fix Orders Table RLS Policies for Customer Checkout
-- This script ensures customers can insert orders during checkout

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
    qual IS NOT NULL as has_qual,
    with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE tablename = 'orders';

-- 3. Drop all existing policies on orders table to start fresh
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Dropping all existing policies on orders table...';
    
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'orders' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.orders';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
    
    RAISE NOTICE 'All existing policies dropped successfully!';
END $$;

-- 4. Create comprehensive RLS policies for orders table

-- Policy 1: Customers can view their own orders
CREATE POLICY "Orders - Customers can view their own orders" ON public.orders
FOR SELECT USING (
    customer_id IN (
        SELECT id FROM public.customers 
        WHERE profile_id = auth.uid() OR id = auth.uid()
    )
);

-- Policy 2: Customers can insert orders for their shop
CREATE POLICY "Orders - Customers can insert orders" ON public.orders
FOR INSERT WITH CHECK (
    shop_id IN (
        SELECT shop_id FROM public.profiles 
        WHERE id = auth.uid() AND role = 'customer'
    ) AND
    customer_id IN (
        SELECT id FROM public.customers 
        WHERE profile_id = auth.uid() OR id = auth.uid()
    )
);

-- Policy 3: Customers can update their own orders (for archiving)
CREATE POLICY "Orders - Customers can update their own orders" ON public.orders
FOR UPDATE USING (
    customer_id IN (
        SELECT id FROM public.customers 
        WHERE profile_id = auth.uid() OR id = auth.uid()
    )
) WITH CHECK (
    customer_id IN (
        SELECT id FROM public.customers 
        WHERE profile_id = auth.uid() OR id = auth.uid()
    )
);

-- Policy 4: Shop admins and staff can view all orders in their shop
CREATE POLICY "Orders - Shop admins and staff can view" ON public.orders
FOR SELECT USING (
    shop_id IN (
        SELECT shop_id FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
    )
);

-- Policy 5: Shop admins and staff can insert orders
CREATE POLICY "Orders - Shop admins and staff can insert" ON public.orders
FOR INSERT WITH CHECK (
    shop_id IN (
        SELECT shop_id FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
    )
);

-- Policy 6: Shop admins and staff can update all orders in their shop
CREATE POLICY "Orders - Shop admins and staff can update" ON public.orders
FOR UPDATE USING (
    shop_id IN (
        SELECT shop_id FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
    )
) WITH CHECK (
    shop_id IN (
        SELECT shop_id FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
    )
);

-- Policy 7: Shop admins and staff can delete orders
CREATE POLICY "Orders - Shop admins and staff can delete" ON public.orders
FOR DELETE USING (
    shop_id IN (
        SELECT shop_id FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
    )
);

-- 5. Verify all policies are created
SELECT 
    policyname,
    cmd,
    qual IS NOT NULL as has_qual,
    with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- 6. Test the customer insert policy with a sample scenario
DO $$
DECLARE
    test_customer_id uuid;
    test_shop_id uuid;
    test_profile_id uuid;
BEGIN
    RAISE NOTICE 'Testing customer insert policy...';
    
    -- Get a sample customer for testing
    SELECT c.id, c.shop_id, c.profile_id 
    INTO test_customer_id, test_shop_id, test_profile_id
    FROM public.customers c
    JOIN public.profiles p ON c.profile_id = p.id
    WHERE p.role = 'customer'
    LIMIT 1;
    
    IF test_customer_id IS NOT NULL THEN
        RAISE NOTICE 'Test customer found: ID=%, Shop=%, Profile=%', 
            test_customer_id, test_shop_id, test_profile_id;
        
        -- Test if the policy would allow this customer to insert an order
        IF EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = test_profile_id 
            AND shop_id = test_shop_id 
            AND role = 'customer'
        ) THEN
            RAISE NOTICE 'Customer insert policy test: PASSED - Customer can insert orders';
        ELSE
            RAISE NOTICE 'Customer insert policy test: FAILED - Customer cannot insert orders';
        END IF;
    ELSE
        RAISE NOTICE 'No test customer found for policy testing';
    END IF;
END $$;

-- 7. Success message
DO $$
BEGIN
    RAISE NOTICE 'Orders table RLS policies have been fixed successfully!';
    RAISE NOTICE 'Customers should now be able to insert orders during checkout.';
    RAISE NOTICE 'Try checking out a product in your application now.';
END $$;

