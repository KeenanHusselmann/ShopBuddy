-- Add Shop Management Functions
-- This migration adds functions for revoking and restoring shop status

-- Create function to revoke shop status
CREATE OR REPLACE FUNCTION public.revoke_shop_status(
    shop_id UUID,
    revoke_reason TEXT,
    admin_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    shop_record RECORD;
    shop_owner_id UUID;
BEGIN
    -- Get the shop details
    SELECT * INTO shop_record
    FROM public.shops
    WHERE id = shop_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Shop not found');
    END IF;
    
    -- Check if shop is already revoked
    IF shop_record.status = 'revoked' THEN
        RETURN json_build_object('success', false, 'error', 'Shop is already revoked');
    END IF;
    
    -- Get the shop owner ID
    SELECT id INTO shop_owner_id
    FROM public.profiles
    WHERE shop_id = shop_id;
    
    -- Update the shop status to revoked
    UPDATE public.shops
    SET 
        status = 'revoked',
        revoked_reason = revoke_reason,
        revoked_at = NOW(),
        revoked_by = admin_user_id
    WHERE id = shop_id;
    
    -- Update the shop owner's profile to remove shop access
    UPDATE public.profiles
    SET 
        shop_registration_status = 'revoked',
        shop_id = NULL
    WHERE id = shop_owner_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Shop status revoked successfully',
        'shop_id', shop_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create function to restore shop status
CREATE OR REPLACE FUNCTION public.restore_shop_status(
    shop_id UUID,
    admin_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    shop_record RECORD;
    shop_owner_id UUID;
BEGIN
    -- Get the shop details
    SELECT * INTO shop_record
    FROM public.shops
    WHERE id = shop_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Shop not found');
    END IF;
    
    -- Check if shop is not revoked
    IF shop_record.status != 'revoked' THEN
        RETURN json_build_object('success', false, 'error', 'Shop is not revoked');
    END IF;
    
    -- Get the shop owner ID
    SELECT id INTO shop_owner_id
    FROM public.profiles
    WHERE shop_id = shop_id;
    
    -- Update the shop status to active
    UPDATE public.shops
    SET 
        status = 'active',
        revoked_reason = NULL,
        revoked_at = NULL,
        revoked_by = NULL
    WHERE id = shop_id;
    
    -- Update the shop owner's profile to restore shop access
    UPDATE public.profiles
    SET 
        shop_registration_status = 'completed',
        shop_id = shop_id
    WHERE id = shop_owner_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Shop status restored successfully',
        'shop_id', shop_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.revoke_shop_status(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_shop_status(UUID, UUID) TO authenticated;

-- Add missing columns to shops table if they don't exist
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS revoked_reason TEXT,
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS revoked_by UUID;

