-- Create Activity Logs Table for Dashboard Notifications
-- Migration: 20250120000019_create_activity_logs.sql

-- Create activity_logs table for dashboard notifications
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    table_name TEXT,
    record_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_shop_id ON public.activity_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- Enable Row Level Security
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Shop owners can view their own activity logs" ON public.activity_logs
    FOR SELECT USING (shop_id IN (
        SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Shop owners can insert their own activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (shop_id IN (
        SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    ));

-- Create RPC function for getting low stock items
CREATE OR REPLACE FUNCTION public.get_low_stock_items(shop_id_param UUID)
RETURNS TABLE(
    id UUID,
    quantity INTEGER,
    reorder_point INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.quantity,
        i.reorder_point
    FROM public.inventory i
    WHERE i.shop_id = shop_id_param 
    AND i.quantity <= i.reorder_point;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_low_stock_items(UUID) TO authenticated;

-- Insert some sample activity logs for testing (optional)
-- INSERT INTO public.activity_logs (shop_id, action, details, table_name) VALUES 
-- ('your-shop-id-here', 'system_startup', '{"message": "Dashboard initialized"}', 'system');
