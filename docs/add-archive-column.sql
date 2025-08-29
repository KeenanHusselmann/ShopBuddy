-- Add Archive Column to Orders Table
-- This allows customers to archive orders they no longer want to see

-- 1. Add archived column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- 2. Add archived_at timestamp column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- 3. Create index on archived column for better performance
CREATE INDEX IF NOT EXISTS idx_orders_archived ON public.orders(archived);

-- 4. Update RLS policies to allow customers to update their own orders for archiving
DROP POLICY IF EXISTS "Orders - Customers can update their own orders" ON public.orders;

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

-- 5. Verify the new column structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('archived', 'archived_at')
ORDER BY column_name;

-- 6. Show final status
DO $$
BEGIN
    RAISE NOTICE 'Archive functionality added to orders table!';
    RAISE NOTICE 'Customers can now archive orders they no longer want to see.';
    RAISE NOTICE 'Archived orders will be hidden from the main orders list.';
END $$;
