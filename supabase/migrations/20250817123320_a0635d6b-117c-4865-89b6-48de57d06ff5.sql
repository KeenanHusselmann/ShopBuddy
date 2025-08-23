-- Drop functions with CASCADE to remove dependent triggers first
DROP FUNCTION public.update_updated_at_column() CASCADE;
DROP FUNCTION public.handle_new_user() CASCADE;

-- Recreate the fixed functions
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

-- Recreate the triggers
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON public.shops
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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