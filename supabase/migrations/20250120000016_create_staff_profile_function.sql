-- Create function to create staff profiles with proper permissions
CREATE OR REPLACE FUNCTION public.create_staff_profile(
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  role TEXT,
  shop_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the profile with the calling user's context
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    shop_id,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    first_name,
    last_name,
    email,
    role,
    shop_id,
    NOW(),
    NOW()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the function
    RAISE LOG 'Error creating staff profile: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_staff_profile(UUID, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- Add RLS policy to allow users to insert their own profile
CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Add RLS policy to allow users to update their own profile
CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Add RLS policy to allow users to view their own profile
CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Add RLS policy to allow shop admins to view staff profiles in their shop
CREATE POLICY IF NOT EXISTS "Shop admins can view staff profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'shop_admin'
      AND admin_profile.shop_id = shop_id
    )
  );
