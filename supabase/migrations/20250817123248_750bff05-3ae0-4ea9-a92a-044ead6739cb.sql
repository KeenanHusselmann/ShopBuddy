-- Fix security definer functions
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'customer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add missing RLS policies
CREATE POLICY "Shop admins can manage subscriptions" ON public.shop_subscriptions
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role = 'shop_admin'
        )
    );

CREATE POLICY "Shop data access" ON public.product_variants
    FOR ALL USING (
        product_id IN (
            SELECT id FROM public.products p
            WHERE p.shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

CREATE POLICY "Shop data access" ON public.inventory
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Shop data access" ON public.order_items
    FOR ALL USING (
        order_id IN (
            SELECT id FROM public.orders o
            WHERE o.shop_id IN (
                SELECT shop_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

CREATE POLICY "Shop data access" ON public.payments
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Shop data access" ON public.suppliers
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Shop data access" ON public.purchase_orders
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );