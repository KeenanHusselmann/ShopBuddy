-- Fix Customer Product Access
-- This script adds RLS policies to allow customers to view products from their shop

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Shop data access" ON public.products;
DROP POLICY IF EXISTS "Products - Shop admins and staff can view" ON public.products;
DROP POLICY IF EXISTS "Shop staff can view products" ON public.products;

-- Create new comprehensive policies for products table
CREATE POLICY "Products - Shop admins and staff can manage" ON public.products
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Allow customers to view products from their shop
CREATE POLICY "Products - Customers can view from their shop" ON public.products
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role = 'customer'
        )
    );

-- Also fix categories table access for customers
DROP POLICY IF EXISTS "Shop data access" ON public.categories;
DROP POLICY IF EXISTS "Categories - Shop admins and staff can view" ON public.categories;
DROP POLICY IF EXISTS "Shop staff can view product categories" ON public.categories;

CREATE POLICY "Categories - Shop admins and staff can manage" ON public.categories
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Allow customers to view categories from their shop
CREATE POLICY "Categories - Customers can view from their shop" ON public.categories
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role = 'customer'
        )
    );

-- Fix inventory table access for customers
DROP POLICY IF EXISTS "Shop data access" ON public.inventory;
DROP POLICY IF EXISTS "Product variants - Shop admins and staff can view" ON public.inventory;

CREATE POLICY "Inventory - Shop admins and staff can manage" ON public.inventory
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Allow customers to view inventory from their shop
CREATE POLICY "Inventory - Customers can view from their shop" ON public.inventory
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role = 'customer'
        )
    );

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('products', 'categories', 'inventory')
ORDER BY tablename, policyname;

-- Test that customers can now access products
SELECT 'Customer product access policies created successfully!' as status;
