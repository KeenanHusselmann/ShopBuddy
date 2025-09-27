-- Create audit trail table for tracking user actions
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for audit logs access
CREATE POLICY "Shop owners can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (shop_id IN ( 
  SELECT profiles.shop_id
  FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'shop_admin'
));

-- Create index for better performance
CREATE INDEX idx_audit_logs_shop_id ON public.audit_logs(shop_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Create Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'csv', 'pdf'
  filters JSONB DEFAULT '{}',
  file_url TEXT,
  generated_by UUID NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policy for reports
CREATE POLICY "Shop data access for reports" 
ON public.reports 
FOR ALL 
USING (shop_id IN ( 
  SELECT profiles.shop_id
  FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = ANY (ARRAY['shop_admin'::user_role, 'staff'::user_role])
));