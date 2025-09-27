-- Fix Order Items RLS Policies
-- This script adds the missing RLS policies for the order_items table

-- 1. Check if order_items table exists and has RLS enabled
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
        RAISE NOTICE 'Order_items table exists';
        
        -- Check if RLS is enabled
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'order_items' AND rowsecurity = true) THEN
            RAISE NOTICE 'RLS is already enabled on order_items table';
        ELSE
            RAISE NOTICE 'Enabling RLS on order_items table...';
            ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
        END IF;
    ELSE
        RAISE NOTICE 'Order_items table does NOT exist!';
        RAISE EXCEPTION 'Order_items table must exist before adding RLS policies';
    END IF;
END $$;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Order items - Shop admins and staff can view" ON public.order_items;
DROP POLICY IF EXISTS "Order items - Shop admins and staff can insert" ON public.order_items;
DROP POLICY IF EXISTS "Order items - Shop admins and staff can update" ON public.order_items;
DROP POLICY IF EXISTS "Order items - Shop admins and staff can delete" ON public.order_items;
DROP POLICY IF EXISTS "Order items - Customers can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Order items - Customers can insert order items" ON public.order_items;

-- Also drop any other potentially conflicting policies
DROP POLICY IF EXISTS "Shop staff can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Shop data access" ON public.order_items;
DROP POLICY IF EXISTS "Order items - Shop data access" ON public.order_items;

-- 3. Create comprehensive RLS policies for order_items table

-- Shop admins and staff can view all order items for their shop
CREATE POLICY "Order items - Shop admins and staff can view" ON public.order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

-- Shop admins and staff can insert order items
CREATE POLICY "Order items - Shop admins and staff can insert" ON public.order_items
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

-- Shop admins and staff can update order items
CREATE POLICY "Order items - Shop admins and staff can update" ON public.order_items
    FOR UPDATE USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    ) WITH CHECK (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

-- Shop admins and staff can delete order items
CREATE POLICY "Order items - Shop admins and staff can delete" ON public.order_items
    FOR DELETE USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

-- Customers can view their own order items
CREATE POLICY "Order items - Customers can view their own order items" ON public.order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE customer_id IN (
                SELECT id FROM public.customers 
                WHERE profile_id = auth.uid() OR id = auth.uid()
            )
        )
    );

-- Customers can insert order items for their own orders
CREATE POLICY "Order items - Customers can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE customer_id IN (
                SELECT id FROM public.customers 
                WHERE profile_id = auth.uid() OR id = auth.uid()
            )
        )
    );

-- 4. Verify the policies were created
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Verifying order_items RLS policies...';
    
    RAISE NOTICE 'Order_items table policies:';
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'order_items' ORDER BY policyname LOOP
        RAISE NOTICE '  - %', r.policyname;
    END LOOP;
    
    RAISE NOTICE 'Policy verification complete!';
END $$;

-- 5. Check the final state
SELECT 
    'order_items' as table_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'order_items';

-- 6. Show table structure for reference
DO $$
DECLARE
    r RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
        RAISE NOTICE 'Order_items table structure:';
        FOR r IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: % - Type: % - Nullable: % - Default: %', 
                r.column_name, r.data_type, r.is_nullable, r.column_default;
        END LOOP;
    END IF;
END $$;
