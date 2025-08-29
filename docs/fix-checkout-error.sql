-- Fix Checkout Error - Add Missing Columns and RLS Policies
-- This script fixes the "Could not find the 'grand_total' column" error
-- This script is designed to be run multiple times safely

-- First, let's check what policies currently exist
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Checking existing policies...';
    
    -- Check orders table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders') THEN
        RAISE NOTICE 'Found existing policies on orders table:';
        FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'orders' LOOP
            RAISE NOTICE '  - %', r.policyname;
        END LOOP;
    ELSE
        RAISE NOTICE 'No existing policies found on orders table';
    END IF;
    
    -- Check customer_cart table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_cart') THEN
        RAISE NOTICE 'Found existing policies on customer_cart table:';
        FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'customer_cart' LOOP
            RAISE NOTICE '  - %', r.policyname;
        END LOOP;
    ELSE
        RAISE NOTICE 'No existing policies found on customer_cart table';
    END IF;
END $$;

-- 1. Add missing columns to orders table if they don't exist
DO $$ 
BEGIN
    -- Add total_amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
        ALTER TABLE public.orders ADD COLUMN total_amount NUMERIC(10, 2) DEFAULT 0.00;
    END IF;
    
    -- Add tax_amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_amount') THEN
        ALTER TABLE public.orders ADD COLUMN tax_amount NUMERIC(10, 2) DEFAULT 0.00;
    END IF;
    
    -- Add grand_total column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'grand_total') THEN
        ALTER TABLE public.orders ADD COLUMN grand_total NUMERIC(10, 2) DEFAULT 0.00;
    END IF;
    
    -- Add payment_method column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE public.orders ADD COLUMN payment_method TEXT DEFAULT 'pending';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE public.orders ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    
    -- Add order_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_type') THEN
        ALTER TABLE public.orders ADD COLUMN order_type TEXT DEFAULT 'pos';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
        ALTER TABLE public.orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    -- Add staff_id column if it doesn't exist (for POS orders)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'staff_id') THEN
        ALTER TABLE public.orders ADD COLUMN staff_id UUID REFERENCES public.profiles(id);
    END IF;
    
    -- Add customer_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
        ALTER TABLE public.orders ADD COLUMN customer_id UUID REFERENCES public.customers(id);
    END IF;
END $$;

-- 2. Create customer_cart table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customer_cart (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(customer_id, product_id, shop_id)
);

-- 3. Enable RLS on customer_cart table
ALTER TABLE public.customer_cart ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
-- Drop all existing customer_cart policies to avoid conflicts
DROP POLICY IF EXISTS "Customers can manage their own cart" ON public.customer_cart;
DROP POLICY IF EXISTS "Shop owners and staff can view customer carts" ON public.customer_cart;
DROP POLICY IF EXISTS "Shop staff can view customer carts" ON public.customer_cart;
DROP POLICY IF EXISTS "Shop data access" ON public.customer_cart;

-- 5. Create RLS policies for customer_cart table
CREATE POLICY "Customers can manage their own cart" ON public.customer_cart
    FOR ALL USING (
        customer_id = auth.uid() AND
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role = 'customer'
        )
    );

CREATE POLICY "Shop owners and staff can view customer carts" ON public.customer_cart
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- 6. Drop existing orders policies if they exist
-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Orders - Shop admins and staff can view" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop admins and staff can insert" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop admins and staff can update" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop admins and staff can delete" ON public.orders;
DROP POLICY IF EXISTS "Orders - Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Orders - Customers can insert orders" ON public.orders;

-- Also drop any other potentially conflicting policies
DROP POLICY IF EXISTS "Shop staff can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Shop data access" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop data access" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop admins and staff can manage" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop admins and staff can view all" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop admins and staff can insert all" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop admins and staff can update all" ON public.orders;
DROP POLICY IF EXISTS "Orders - Shop admins and staff can delete all" ON public.orders;

-- 7. Create comprehensive RLS policies for orders table
-- Shop admins and staff can view all orders for their shop
CREATE POLICY "Orders - Shop admins and staff can view" ON public.orders
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Shop admins and staff can insert orders
CREATE POLICY "Orders - Shop admins and staff can insert" ON public.orders
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Shop admins and staff can update orders
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

-- Shop admins and staff can delete orders
CREATE POLICY "Orders - Shop admins and staff can delete" ON public.orders
    FOR DELETE USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Customers can view their own orders
CREATE POLICY "Orders - Customers can view their own orders" ON public.orders
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM public.customers 
            WHERE id = auth.uid() AND shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role = 'customer'
            )
        )
    );

-- Customers can insert orders for their shop
CREATE POLICY "Orders - Customers can insert orders" ON public.orders
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role = 'customer'
        ) AND
        customer_id IN (
            SELECT id FROM public.customers 
            WHERE id = auth.uid() AND shop_id = shop_id
        )
    );

-- 8. Create trigger to update updated_at timestamp
-- Drop existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_orders_updated_at_column ON public.orders;
DROP TRIGGER IF EXISTS update_orders_updated_at_timestamp ON public.orders;

-- Create trigger for orders table
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_cart_customer_shop ON public.customer_cart(customer_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_customer_cart_product ON public.customer_cart(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON public.orders(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- 10. Verify the setup
SELECT 
    'orders' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('total_amount', 'tax_amount', 'grand_total', 'payment_method', 'status', 'order_type', 'customer_id')
ORDER BY column_name;

SELECT 
    'customer_cart' as table_name,
    COUNT(*) as row_count
FROM public.customer_cart;

SELECT 
    'orders' as table_name,
    COUNT(*) as row_count
FROM public.orders;

-- 11. Verify that all policies were created successfully
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Verifying policy creation...';
    
    -- Check orders table policies
    RAISE NOTICE 'Orders table policies:';
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'orders' ORDER BY policyname LOOP
        RAISE NOTICE '  - %', r.policyname;
    END LOOP;
    
    -- Check customer_cart table policies
    RAISE NOTICE 'Customer_cart table policies:';
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'customer_cart' ORDER BY policyname LOOP
        RAISE NOTICE '  - %', r.policyname;
    END LOOP;
    
    RAISE NOTICE 'Policy verification complete!';
END $$;
