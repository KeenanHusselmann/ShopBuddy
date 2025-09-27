-- Simple Archive Fix for Customer Orders
-- This script adds archive columns and fixes RLS policies

-- 1. Add archive columns if they don't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_archived ON public.orders(archived);

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Orders - Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop staff can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Orders - Customers can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop staff can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop staff can insert orders" ON public.orders;

-- 4. Create essential RLS policies
-- Customers can view their own orders
CREATE POLICY "Orders - Customers can view their own orders" ON public.orders
FOR SELECT USING (
  auth.uid() IN (
    SELECT p.id FROM profiles p
    JOIN customers c ON c.profile_id = p.id
    WHERE c.id = orders.customer_id AND p.shop_id = orders.shop_id
  )
);

-- Shop staff can view all orders in their shop
CREATE POLICY "Orders - Shop staff can view all orders" ON public.orders
FOR SELECT USING (
  auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.shop_id = orders.shop_id 
    AND p.role IN ('shop_admin', 'staff')
  )
);

-- Customers can update their own orders (for archiving)
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

-- Shop staff can update all orders in their shop
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

-- Shop staff can insert orders
CREATE POLICY "Orders - Shop staff can insert orders" ON public.orders
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT p.id FROM profiles p
    WHERE p.shop_id = orders.shop_id 
    AND p.role IN ('shop_admin', 'staff')
  )
);

-- 5. Verify the setup
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('archived', 'archived_at')
ORDER BY column_name;

-- 6. Show created policies
SELECT 
    policyname,
    cmd,
    qual IS NOT NULL as has_qual,
    with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- 7. Success message
DO $$
BEGIN
    RAISE NOTICE 'Archive functionality has been added successfully!';
    RAISE NOTICE 'Customers should now be able to archive their own orders.';
    RAISE NOTICE 'Try archiving an order in your application now.';
END $$;
