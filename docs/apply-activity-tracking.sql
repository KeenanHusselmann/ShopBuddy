-- Apply Activity Tracking Tables to Existing Database
-- This script creates the necessary tables for comprehensive staff activity tracking

-- =====================================================
-- CREATE ACTIVITY TRACKING TABLES
-- =====================================================

-- Create staff_activity_logs table for comprehensive activity tracking
CREATE TABLE IF NOT EXISTS public.staff_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Create staff_login_sessions table for tracking login/logout times
CREATE TABLE IF NOT EXISTS public.staff_login_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    logout_time TIMESTAMP WITH TIME ZONE,
    session_duration INTEGER, -- in minutes
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create staff_permissions table for role-based access control
CREATE TABLE IF NOT EXISTS public.staff_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission_type TEXT NOT NULL CHECK (permission_type IN ('products', 'orders', 'customers', 'inventory', 'reports', 'settings', 'pos', 'staff_management', 'activity_logs')),
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

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.staff_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- RLS Policies for staff_activity_logs
CREATE POLICY "Shop staff can view their own activities" ON public.staff_activity_logs
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Shop admins can view all staff activities" ON public.staff_activity_logs
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'shop_admin'
        )
    );

CREATE POLICY "System can create activity logs" ON public.staff_activity_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for staff_login_sessions
CREATE POLICY "Shop staff can view their own login sessions" ON public.staff_login_sessions
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Shop admins can view all login sessions" ON public.staff_login_sessions
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'shop_admin'
        )
    );

CREATE POLICY "Users can create their own login sessions" ON public.staff_login_sessions
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('shop_admin', 'staff')
        )
    );

CREATE POLICY "Users can update their own login sessions" ON public.staff_login_sessions
    FOR UPDATE USING (
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

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_shop_id ON public.staff_activity_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_user_id ON public.staff_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_action ON public.staff_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_created_at ON public.staff_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_table_name ON public.staff_activity_logs(table_name);

CREATE INDEX IF NOT EXISTS idx_staff_login_sessions_shop_id ON public.staff_login_sessions(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_login_sessions_user_id ON public.staff_login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_login_sessions_login_time ON public.staff_login_sessions(login_time);
CREATE INDEX IF NOT EXISTS idx_staff_login_sessions_logout_time ON public.staff_login_sessions(logout_time);

CREATE INDEX IF NOT EXISTS idx_staff_permissions_shop_id ON public.staff_permissions(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_staff_id ON public.staff_permissions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_type ON public.staff_permissions(permission_type);

CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_id ON public.shop_settings(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_settings_key ON public.shop_settings(setting_key);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default shop settings for POS configuration
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
    'inventory',
    true, true, true, false
FROM public.profiles p
WHERE p.role = 'staff' AND p.shop_id IS NOT NULL
ON CONFLICT (shop_id, staff_id, permission_type) DO NOTHING;

INSERT INTO public.staff_permissions (shop_id, staff_id, permission_type, can_view, can_create, can_edit, can_delete)
SELECT 
    p.shop_id,
    p.id,
    'activity_logs',
    true, false, false, false
FROM public.profiles p
WHERE p.role = 'staff' AND p.shop_id IS NOT NULL
ON CONFLICT (shop_id, staff_id, permission_type) DO NOTHING;

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to calculate session duration
CREATE OR REPLACE FUNCTION public.calculate_session_duration(session_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    duration_minutes INTEGER;
BEGIN
    SELECT 
        EXTRACT(EPOCH FROM (logout_time - login_time)) / 60
    INTO duration_minutes
    FROM public.staff_login_sessions
    WHERE id = session_id_param AND logout_time IS NOT NULL;
    
    RETURN COALESCE(duration_minutes, 0);
END;
$$;

-- Function to get staff activity summary
CREATE OR REPLACE FUNCTION public.get_staff_activity_summary(
    shop_id_param UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_logins', (
            SELECT COUNT(*) 
            FROM public.staff_login_sessions 
            WHERE shop_id = shop_id_param 
            AND login_time >= NOW() - INTERVAL '1 day' * days_back
        ),
        'total_activities', (
            SELECT COUNT(*) 
            FROM public.staff_activity_logs 
            WHERE shop_id = shop_id_param 
            AND created_at >= NOW() - INTERVAL '1 day' * days_back
        ),
        'active_sessions', (
            SELECT COUNT(*) 
            FROM public.staff_login_sessions 
            WHERE shop_id = shop_id_param 
            AND logout_time IS NULL
        ),
        'top_actions', (
            SELECT jsonb_agg(action_count)
            FROM (
                SELECT jsonb_build_object('action', action, 'count', COUNT(*)) as action_count
                FROM public.staff_activity_logs 
                WHERE shop_id = shop_id_param 
                AND created_at >= NOW() - INTERVAL '1 day' * days_back
                GROUP BY action 
                ORDER BY COUNT(*) DESC 
                LIMIT 5
            ) actions
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_session_duration(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_activity_summary(UUID, INTEGER) TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ Created Successfully'
        ELSE '❌ Failed to Create'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'staff_activity_logs',
    'staff_login_sessions', 
    'staff_permissions',
    'shop_settings'
)
ORDER BY table_name;

-- Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'staff_activity_logs',
    'staff_login_sessions', 
    'staff_permissions',
    'shop_settings'
)
ORDER BY table_name, ordinal_position;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
    'staff_activity_logs',
    'staff_login_sessions', 
    'staff_permissions',
    'shop_settings'
)
ORDER BY tablename, policyname;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
    'staff_activity_logs',
    'staff_login_sessions', 
    'staff_permissions',
    'shop_settings'
)
ORDER BY tablename, indexname;

-- Check functions
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname IN (
    'calculate_session_duration',
    'get_staff_activity_summary'
)
ORDER BY proname;
