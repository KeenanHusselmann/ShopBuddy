-- Fix incomplete RLS policies for products and other tables
-- The current policies only have USING clauses but are missing WITH CHECK clauses for INSERT/UPDATE/DELETE

-- Drop the incomplete policies first
DROP POLICY IF EXISTS "Shop data access" ON public.products;
DROP POLICY IF EXISTS "Shop data access" ON public.categories;
DROP POLICY IF EXISTS "Shop data access" ON public.customers;
DROP POLICY IF EXISTS "Shop data access" ON public.orders;

-- Recreate complete RLS policies for products table
CREATE POLICY "Products - Shop admins and staff can view" ON public.products
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Products - Shop admins and staff can insert" ON public.products
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Products - Shop admins and staff can update" ON public.products
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

CREATE POLICY "Products - Shop admins and staff can delete" ON public.products
    FOR DELETE USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Recreate complete RLS policies for categories table
CREATE POLICY "Categories - Shop admins and staff can view" ON public.categories
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Categories - Shop admins and staff can insert" ON public.categories
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Categories - Shop admins and staff can update" ON public.categories
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

CREATE POLICY "Categories - Shop admins and staff can delete" ON public.categories
    FOR DELETE USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Recreate complete RLS policies for customers table
CREATE POLICY "Customers - Shop admins and staff can view" ON public.customers
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Customers - Shop admins and staff can insert" ON public.customers
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Customers - Shop admins and staff can update" ON public.customers
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

CREATE POLICY "Customers - Shop admins and staff can delete" ON public.customers
    FOR DELETE USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Recreate complete RLS policies for orders table
CREATE POLICY "Orders - Shop admins and staff can view" ON public.orders
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Orders - Shop admins and staff can insert" ON public.orders
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

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

CREATE POLICY "Orders - Shop admins and staff can delete" ON public.orders
    FOR DELETE USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Also fix the other tables that have incomplete policies
-- Drop incomplete policies
DROP POLICY IF EXISTS "Shop data access" ON public.product_variants;
DROP POLICY IF EXISTS "Shop data access" ON public.inventory;
DROP POLICY IF EXISTS "Shop data access" ON public.order_items;
DROP POLICY IF EXISTS "Shop data access" ON public.payments;
DROP POLICY IF EXISTS "Shop data access" ON public.suppliers;
DROP POLICY IF EXISTS "Shop data access" ON public.purchase_orders;

-- Recreate complete policies for product_variants
CREATE POLICY "Product variants - Shop admins and staff can view" ON public.product_variants
    FOR SELECT USING (
        product_id IN (
            SELECT id FROM public.products p
            WHERE p.shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

CREATE POLICY "Product variants - Shop admins and staff can insert" ON public.product_variants
    FOR INSERT WITH CHECK (
        product_id IN (
            SELECT id FROM public.products p
            WHERE p.shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

CREATE POLICY "Product variants - Shop admins and staff can update" ON public.product_variants
    FOR UPDATE USING (
        product_id IN (
            SELECT id FROM public.products p
            WHERE p.shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    ) WITH CHECK (
        product_id IN (
            SELECT id FROM public.products p
            WHERE p.shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

CREATE POLICY "Product variants - Shop admins and staff can delete" ON public.product_variants
    FOR DELETE USING (
        product_id IN (
            SELECT id FROM public.products p
            WHERE p.shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

-- Recreate complete policies for inventory
CREATE POLICY "Inventory - Shop admins and staff can view" ON public.inventory
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Inventory - Shop admins and staff can insert" ON public.inventory
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Inventory - Shop admins and staff can update" ON public.inventory
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

CREATE POLICY "Inventory - Shop admins and staff can delete" ON public.inventory
    FOR DELETE USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Recreate complete policies for order_items
CREATE POLICY "Order items - Shop admins and staff can view" ON public.order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM public.orders o
            WHERE o.shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

CREATE POLICY "Order items - Shop admins and staff can insert" ON public.order_items
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT id FROM public.orders o
            WHERE o.shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

CREATE POLICY "Order items - Shop admins and staff can update" ON public.order_items
    FOR UPDATE USING (
        order_id IN (
            SELECT id FROM public.orders o
            WHERE o.shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    ) WITH CHECK (
        order_id IN (
            SELECT id FROM public.orders o
            WHERE o.shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

CREATE POLICY "Order items - Shop admins and staff can delete" ON public.order_items
    FOR DELETE USING (
        order_id IN (
            SELECT id FROM public.orders o
            WHERE o.shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

-- Recreate complete policies for payments
CREATE POLICY "Payments - Shop admins and staff can view" ON public.payments
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Payments - Shop admins and staff can insert" ON public.payments
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Payments - Shop admins and staff can update" ON public.payments
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

CREATE POLICY "Payments - Shop admins and staff can delete" ON public.payments
    FOR DELETE USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Recreate complete policies for suppliers
CREATE POLICY "Suppliers - Shop admins and staff can view" ON public.suppliers
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Suppliers - Shop admins and staff can insert" ON public.suppliers
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Suppliers - Shop admins and staff can update" ON public.suppliers
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

CREATE POLICY "Suppliers - Shop admins and staff can delete" ON public.suppliers
    FOR DELETE USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- Recreate complete policies for purchase_orders
CREATE POLICY "Purchase orders - Shop admins and staff can view" ON public.purchase_orders
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Purchase orders - Shop admins and staff can insert" ON public.purchase_orders
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Purchase orders - Shop admins and staff can update" ON public.purchase_orders
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

CREATE POLICY "Purchase orders - Shop admins and staff can delete" ON public.purchase_orders
    FOR DELETE USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );
