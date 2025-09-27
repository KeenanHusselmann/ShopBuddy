# Supabase Migration Instructions

## Issue
The staff invitation system is failing with a 404 error because the `invite_staff_member` function is missing from the database, and there's a schema mismatch between the `profiles` table and the functions trying to use it.

## Solution
Apply the following migration to fix the issue:

### Migration File: `20250120000015_fix_profiles_email_field.sql`

This migration:
1. Adds the missing `email` field to the `profiles` table
2. Updates the `invite_staff_member` function to work correctly
3. Updates the `accept_staff_invitation` function
4. Adds proper indexes and permissions

## How to Apply

### Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Login to your Supabase account:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Apply the migration:
   ```bash
   supabase db push
   ```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20250120000015_fix_profiles_email_field.sql`
4. Execute the SQL

### Option 3: Manual SQL Execution

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Run the following SQL commands:

```sql
-- Add email field to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
        CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
    END IF;
END $$;

-- Create the invite_staff_member function
CREATE OR REPLACE FUNCTION public.invite_staff_member(
    shop_id_param UUID,
    email_param TEXT,
    first_name_param TEXT,
    last_name_param TEXT,
    role_param TEXT DEFAULT 'staff',
    permissions_param JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_id UUID;
    invitation_token TEXT;
    result JSONB;
BEGIN
    -- Check if user is shop admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND shop_id = shop_id_param 
        AND role = 'shop_admin'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only shop owners can invite staff members');
    END IF;

    -- Check if email already has a pending invitation
    IF EXISTS (
        SELECT 1 FROM public.staff_invitations 
        WHERE email = email_param AND shop_id = shop_id_param AND status = 'pending'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Staff invitation already sent to this email');
    END IF;

    -- Check if user already exists in this shop
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE email = email_param AND shop_id = shop_id_param
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'A user with this email already exists in your shop');
    END IF;

    -- Generate invitation token
    invitation_token := encode(gen_random_bytes(32), 'hex');

    -- Create invitation
    INSERT INTO public.staff_invitations (
        shop_id, invited_by, email, first_name, last_name, 
        role, permissions, invitation_token
    ) VALUES (
        shop_id_param, auth.uid(), email_param, first_name_param, 
        last_name_param, role_param, permissions_param, invitation_token
    ) RETURNING id INTO invitation_id;

    -- Create audit log
    INSERT INTO public.audit_logs (
        shop_id, user_id, user_name, user_role, action, 
        table_name, record_id, new_values, metadata
    ) VALUES (
        shop_id_param, auth.uid(), 
        (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = auth.uid()),
        'shop_admin', 'staff_invited', 'staff_invitations', 
        invitation_id, jsonb_build_object('email', email_param, 'role', role_param), 
        jsonb_build_object('invitation_id', invitation_id)
    );

    RETURN jsonb_build_object(
        'success', true, 
        'invitation_id', invitation_id,
        'invitation_token', invitation_token,
        'message', 'Staff invitation sent successfully'
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.invite_staff_member(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
```

## Verification

After applying the migration:

1. The staff invitation form should work without 404 errors
2. You should be able to invite staff members successfully
3. The `invite_staff_member` function should exist in your database

## Troubleshooting

If you still get errors:

1. Check that the `profiles` table has an `email` column
2. Verify the `invite_staff_member` function exists in your database
3. Check the Supabase logs for any SQL errors
4. Ensure your RLS policies are correctly configured

## Notes

- The migration is designed to be safe and won't overwrite existing data
- The `email` field is added as nullable to avoid breaking existing records
- All necessary indexes and permissions are created automatically
- The function includes proper error handling and validation
