-- Fix for Customers Table Structure
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- First, let's check if the customers table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'customers'
) as customers_table_exists;

-- Create the customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    customer_type TEXT DEFAULT 'regular' CHECK (customer_type IN ('regular', 'vip', 'wholesale', 'retail', 'Retail Customer', 'VIP Customer', 'Wholesale Customer', 'Regular Customer')),
    date_of_birth DATE,
    age_verified BOOLEAN DEFAULT false,
    loyalty_points INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- If the table exists but is missing columns, add them
DO $$ 
BEGIN
    -- Add customer_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'customer_type'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN customer_type TEXT DEFAULT 'regular';
        RAISE NOTICE 'Added customer_type column to customers table';
    ELSE
        RAISE NOTICE 'customer_type column already exists';
    END IF;

    -- Add date_of_birth column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Added date_of_birth column to customers table';
    ELSE
        RAISE NOTICE 'date_of_birth column already exists';
    END IF;

    -- Add age_verified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'age_verified'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN age_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added age_verified column to customers table';
    ELSE
        RAISE NOTICE 'age_verified column already exists';
    END IF;

    -- Add loyalty_points column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'loyalty_points'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN loyalty_points INTEGER DEFAULT 0;
        RAISE NOTICE 'Added loyalty_points column to customers table';
    ELSE
        RAISE NOTICE 'loyalty_points column already exists';
    END IF;

    -- Add total_spent column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'total_spent'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN total_spent DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added total_spent column to customers table';
    ELSE
        RAISE NOTICE 'total_spent column already exists';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON public.customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON public.customers(customer_type);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view their own profile" ON public.customers;
DROP POLICY IF EXISTS "Shop owners can manage their customers" ON public.customers;
DROP POLICY IF EXISTS "Staff can view customers for their shop" ON public.customers;

-- Create RLS policies for customers table
CREATE POLICY "Customers can view their own profile" ON public.customers
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Shop owners can manage their customers" ON public.customers
    FOR ALL USING (shop_id IN (
        SELECT shop_id FROM public.profiles 
        WHERE id = auth.uid() AND role = 'shop_admin'
    ));

CREATE POLICY "Staff can view customers for their shop" ON public.customers
    FOR SELECT USING (shop_id IN (
        SELECT shop_id FROM public.profiles 
        WHERE id = auth.uid() AND shop_id IS NOT NULL
    ));

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;

-- Verify the table structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Test that the table is ready
SELECT 'Customers table is ready!' as status;
