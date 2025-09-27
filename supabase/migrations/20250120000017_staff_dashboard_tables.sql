-- Staff Dashboard Tables and Features
-- Migration: 20250120000017_staff_dashboard_tables.sql

-- Create products table for shop inventory management
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    barcode TEXT,
    category TEXT,
    product_type TEXT DEFAULT 'physical' CHECK (product_type IN ('physical', 'digital', 'service')),
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    max_stock_level INTEGER,
    unit TEXT DEFAULT 'piece',
    weight DECIMAL(8,3),
    dimensions JSONB,
    images TEXT[],
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- Create product_categories table for organizing products
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES public.product_categories(id),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(shop_id, name)
);

-- Create orders table for customer orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    customer_id UUID REFERENCES public.profiles(id),
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    order_type TEXT DEFAULT 'retail' CHECK (order_type IN ('retail', 'wholesale', 'online', 'pos')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled', 'refunded')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'failed', 'refunded')),
    payment_method TEXT,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    internal_notes TEXT,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expected_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id),
    UNIQUE(shop_id, order_number)
);

-- Create order_items table for order line items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    product_sku TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customers table for customer management
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address JSONB,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    customer_type TEXT DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale', 'vip')),
    loyalty_points INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    last_order_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id),
    UNIQUE(shop_id, email)
);

-- Create pos_transactions table for POS system
CREATE TABLE IF NOT EXISTS public.pos_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    transaction_number TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    customer_id UUID REFERENCES public.customers(id),
    staff_id UUID NOT NULL REFERENCES public.profiles(id),
    transaction_type TEXT DEFAULT 'sale' CHECK (transaction_type IN ('sale', 'return', 'refund', 'exchange')),
    payment_method TEXT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    change_amount DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(shop_id, transaction_number)
);

-- Create notifications table for real-time notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id),
    sender_id UUID REFERENCES public.profiles(id),
    type TEXT NOT NULL CHECK (type IN ('order', 'inventory', 'customer', 'system', 'staff', 'general')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create activity_logs table for tracking staff activities
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create inventory_transactions table for stock tracking
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'return', 'adjustment', 'transfer', 'damage', 'expiry')),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    performed_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create staff_permissions table for role-based access control
CREATE TABLE IF NOT EXISTS public.staff_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES public.profiles(id),
    permission_type TEXT NOT NULL CHECK (permission_type IN ('products', 'orders', 'customers', 'inventory', 'reports', 'settings', 'pos', 'staff_management')),
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_approve BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(shop_id, staff_id, permission_type)
);

-- Create shop_settings table for shop configuration
CREATE TABLE IF NOT EXISTS public.shop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value JSONB,
    setting_type TEXT DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'array')),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(shop_id, setting_key)
);

-- Enable RLS for all new tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Shop staff can view products" ON public.products
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Shop staff can manage products" ON public.products
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- RLS Policies for product_categories
CREATE POLICY "Shop staff can view product categories" ON public.product_categories
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Shop staff can manage product categories" ON public.product_categories
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- RLS Policies for orders
CREATE POLICY "Shop staff can view orders" ON public.orders
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Shop staff can manage orders" ON public.orders
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- RLS Policies for order_items
CREATE POLICY "Shop staff can view order items" ON public.order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM public.orders
            WHERE shop_id IN (
                SELECT shop_id FROM public.profiles
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

CREATE POLICY "Shop staff can manage order items" ON public.order_items
    FOR ALL USING (
        order_id IN (
            SELECT id FROM public.orders
            WHERE shop_id IN (
                SELECT shop_id FROM public.profiles
                WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
            )
        )
    );

-- RLS Policies for customers
CREATE POLICY "Shop staff can view customers" ON public.customers
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Shop staff can manage customers" ON public.customers
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- RLS Policies for pos_transactions
CREATE POLICY "Shop staff can view POS transactions" ON public.pos_transactions
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Shop staff can create POS transactions" ON public.pos_transactions
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Shop staff can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- RLS Policies for activity_logs
CREATE POLICY "Shop staff can view activity logs" ON public.activity_logs
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "System can create activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for inventory_transactions
CREATE POLICY "Shop staff can view inventory transactions" ON public.inventory_transactions
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Shop staff can create inventory transactions" ON public.inventory_transactions
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

-- RLS Policies for staff_permissions
CREATE POLICY "Shop admins can manage staff permissions" ON public.staff_permissions
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'shop_admin'
        )
    );

CREATE POLICY "Staff can view their own permissions" ON public.staff_permissions
    FOR SELECT USING (staff_id = auth.uid());

-- RLS Policies for shop_settings
CREATE POLICY "Shop staff can view shop settings" ON public.shop_settings
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Shop admins can manage shop settings" ON public.shop_settings
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'shop_admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);

CREATE INDEX IF NOT EXISTS idx_product_categories_shop_id ON public.product_categories(shop_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON public.product_categories(parent_category_id);

CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON public.customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON public.customers(is_active);

CREATE INDEX IF NOT EXISTS idx_pos_transactions_shop_id ON public.pos_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_staff_id ON public.pos_transactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_created_at ON public.pos_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_shop_id ON public.notifications(shop_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_activity_logs_shop_id ON public.activity_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_shop_id ON public.inventory_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON public.inventory_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_staff_permissions_shop_id ON public.staff_permissions(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_staff_id ON public.staff_permissions(staff_id);

CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_id ON public.shop_settings(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_settings_key ON public.shop_settings(setting_key);

-- Create functions for common operations

-- Function to create a new product
CREATE OR REPLACE FUNCTION public.create_product(
    shop_id_param UUID,
    name_param TEXT,
    description_param TEXT DEFAULT NULL,
    price_param DECIMAL(10,2),
    category_param TEXT DEFAULT NULL,
    stock_quantity_param INTEGER DEFAULT 0,
    created_by_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_product_id UUID;
    result JSONB;
BEGIN
    -- Check if user has permission to create products
    IF NOT EXISTS (
        SELECT 1 FROM public.staff_permissions
        WHERE shop_id = shop_id_param 
        AND staff_id = created_by_param 
        AND permission_type = 'products'
        AND can_create = true
    ) AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = created_by_param 
        AND shop_id = shop_id_param 
        AND role = 'shop_admin'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions to create products');
    END IF;

    -- Create the product
    INSERT INTO public.products (
        shop_id, name, description, price, category, stock_quantity, created_by
    ) VALUES (
        shop_id_param, name_param, description_param, price_param, category_param, stock_quantity_param, created_by_param
    ) RETURNING id INTO new_product_id;

    -- Log the activity
    INSERT INTO public.activity_logs (
        shop_id, user_id, action, table_name, record_id, new_values
    ) VALUES (
        shop_id_param, created_by_param, 'product_created', 'products', new_product_id,
        jsonb_build_object('name', name_param, 'price', price_param, 'category', category_param)
    );

    RETURN jsonb_build_object(
        'success', true,
        'product_id', new_product_id,
        'message', 'Product created successfully'
    );
END;
$$;

-- Function to create a new order
CREATE OR REPLACE FUNCTION public.create_order(
    shop_id_param UUID,
    customer_id_param UUID DEFAULT NULL,
    customer_name_param TEXT DEFAULT NULL,
    customer_email_param TEXT DEFAULT NULL,
    customer_phone_param TEXT DEFAULT NULL,
    order_type_param TEXT DEFAULT 'retail',
    created_by_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id UUID;
    order_number_param TEXT;
    result JSONB;
BEGIN
    -- Check if user has permission to create orders
    IF NOT EXISTS (
        SELECT 1 FROM public.staff_permissions
        WHERE shop_id = shop_id_param 
        AND staff_id = created_by_param 
        AND permission_type = 'orders'
        AND can_create = true
    ) AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = created_by_param 
        AND shop_id = shop_id_param 
        AND role = 'shop_admin'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions to create orders');
    END IF;

    -- Generate order number
    SELECT 'ORD-' || shop_id_param::text || '-' || EXTRACT(YEAR FROM NOW()) || '-' || 
           LPAD(EXTRACT(MONTH FROM NOW())::text, 2, '0') || '-' || 
           LPAD(EXTRACT(DAY FROM NOW())::text, 2, '0') || '-' || 
           LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'ORD-.*-.*-.*-.*-([0-9]+)$') AS INTEGER)), 0) + 1 
                FROM public.orders 
                WHERE shop_id = shop_id_param 
                AND DATE(created_at) = CURRENT_DATE)::text, 4, '0')
    INTO order_number_param;

    -- Create the order
    INSERT INTO public.orders (
        shop_id, order_number, customer_id, customer_name, customer_email, customer_phone, order_type, created_by
    ) VALUES (
        shop_id_param, order_number_param, customer_id_param, customer_name_param, customer_email_param, customer_phone_param, order_type_param, created_by_param
    ) RETURNING id INTO new_order_id;

    -- Log the activity
    INSERT INTO public.activity_logs (
        shop_id, user_id, action, table_name, record_id, new_values
    ) VALUES (
        shop_id_param, created_by_param, 'order_created', 'orders', new_order_id,
        jsonb_build_object('order_number', order_number_param, 'order_type', order_type_param)
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', new_order_id,
        'order_number', order_number_param,
        'message', 'Order created successfully'
    );
END;
$$;

-- Function to create a new customer
CREATE OR REPLACE FUNCTION public.create_customer(
    shop_id_param UUID,
    first_name_param TEXT,
    last_name_param TEXT,
    email_param TEXT DEFAULT NULL,
    phone_param TEXT DEFAULT NULL,
    created_by_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_customer_id UUID;
    result JSONB;
BEGIN
    -- Check if user has permission to create customers
    IF NOT EXISTS (
        SELECT 1 FROM public.staff_permissions
        WHERE shop_id = shop_id_param 
        AND staff_id = created_by_param 
        AND permission_type = 'customers'
        AND can_create = true
    ) AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = created_by_param 
        AND shop_id = shop_id_param 
        AND role = 'shop_admin'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions to create customers');
    END IF;

    -- Create the customer
    INSERT INTO public.customers (
        shop_id, first_name, last_name, email, phone, created_by
    ) VALUES (
        shop_id_param, first_name_param, last_name_param, email_param, phone_param, created_by_param
    ) RETURNING id INTO new_customer_id;

    -- Log the activity
    INSERT INTO public.activity_logs (
        shop_id, user_id, action, table_name, record_id, new_values
    ) VALUES (
        shop_id_param, created_by_param, 'customer_created', 'customers', new_customer_id,
        jsonb_build_object('first_name', first_name_param, 'last_name', last_name_param, 'email', email_param)
    );

    RETURN jsonb_build_object(
        'success', true,
        'customer_id', new_customer_id,
        'message', 'Customer created successfully'
    );
END;
$$;

-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
    shop_id_param UUID,
    recipient_id_param UUID,
    type_param TEXT,
    title_param TEXT,
    message_param TEXT,
    data_param JSONB DEFAULT '{}',
    sender_id_param UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_notification_id UUID;
    result JSONB;
BEGIN
    -- Create the notification
    INSERT INTO public.notifications (
        shop_id, recipient_id, sender_id, type, title, message, data
    ) VALUES (
        shop_id_param, recipient_id_param, sender_id_param, type_param, title_param, message_param, data_param
    ) RETURNING id INTO new_notification_id;

    RETURN jsonb_build_object(
        'success', true,
        'notification_id', new_notification_id,
        'message', 'Notification created successfully'
    );
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(
    notification_id_param UUID,
    user_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Update the notification
    UPDATE public.notifications 
    SET is_read = true, read_at = now()
    WHERE id = notification_id_param AND recipient_id = user_id_param;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'message', 'Notification marked as read');
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Notification not found or access denied');
    END IF;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert default shop settings
INSERT INTO public.shop_settings (shop_id, setting_key, setting_value, setting_type, description, is_public)
SELECT 
    s.id,
    'pos_settings',
    jsonb_build_object(
        'tax_rate', 0.10,
        'currency', 'USD',
        'receipt_header', 'Thank you for your purchase!',
        'receipt_footer', 'Please come again!'
    ),
    'json',
    'POS system configuration settings',
    false
FROM public.shops s
ON CONFLICT (shop_id, setting_key) DO NOTHING;

-- Insert default staff permissions for existing staff members
INSERT INTO public.staff_permissions (shop_id, staff_id, permission_type, can_view, can_create, can_edit, can_delete)
SELECT 
    p.shop_id,
    p.id,
    'products',
    true, true, true, false
FROM public.profiles p
WHERE p.role = 'staff' AND p.shop_id IS NOT NULL
ON CONFLICT (shop_id, staff_id, permission_type) DO NOTHING;

INSERT INTO public.staff_permissions (shop_id, staff_id, permission_type, can_view, can_create, can_edit, can_delete)
SELECT 
    p.shop_id,
    p.id,
    'orders',
    true, true, true, false
FROM public.profiles p
WHERE p.role = 'staff' AND p.shop_id IS NOT NULL
ON CONFLICT (shop_id, staff_id, permission_type) DO NOTHING;

INSERT INTO public.staff_permissions (shop_id, staff_id, permission_type, can_view, can_create, can_edit, can_delete)
SELECT 
    p.shop_id,
    p.id,
    'customers',
    true, true, true, false
FROM public.profiles p
WHERE p.role = 'staff' AND p.shop_id IS NOT NULL
ON CONFLICT (shop_id, staff_id, permission_type) DO NOTHING;

INSERT INTO public.staff_permissions (shop_id, staff_id, permission_type, can_view, can_create, can_edit, can_delete)
SELECT 
    p.shop_id,
    p.id,
    'pos',
    true, true, false, false
FROM public.profiles p
WHERE p.role = 'staff' AND p.shop_id IS NOT NULL
ON CONFLICT (shop_id, staff_id, permission_type) DO NOTHING;
