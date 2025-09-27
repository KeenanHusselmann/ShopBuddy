-- Create Customer Cart System
-- This script sets up the shopping cart functionality and updates the orders table

-- 1. Create customer_cart table
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

-- 2. Add RLS policies for customer_cart table
ALTER TABLE public.customer_cart ENABLE ROW LEVEL SECURITY;

-- Customers can manage their own cart
CREATE POLICY "Customers can manage their own cart" ON public.customer_cart
    FOR ALL USING (
        customer_id = auth.uid() AND
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role = 'customer'
        )
    );

-- Shop owners and staff can view customer carts for their shop
CREATE POLICY "Shop owners and staff can view customer carts" ON public.customer_cart
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- 3. Update orders table to add missing columns if they don't exist
DO $$ 
BEGIN
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
        ALTER TABLE public.orders ADD COLUMN payment_method TEXT DEFAULT 'cash';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE public.orders ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- 4. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;

-- Create trigger for orders table
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_cart_customer_shop ON public.customer_cart(customer_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_customer_cart_product ON public.customer_cart(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON public.orders(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- 6. Insert sample data for testing (optional)
-- Uncomment the following lines if you want to test with sample data

/*
INSERT INTO public.customer_cart (customer_id, product_id, shop_id, quantity) 
SELECT 
    c.id as customer_id,
    p.id as product_id,
    c.shop_id,
    1 as quantity
FROM public.customers c
CROSS JOIN public.products p
WHERE c.shop_id = p.shop_id
LIMIT 5;
*/

-- 7. Verify the setup
SELECT 
    'customer_cart' as table_name,
    COUNT(*) as row_count
FROM public.customer_cart
UNION ALL
SELECT 
    'orders' as table_name,
    COUNT(*) as row_count
FROM public.orders;
