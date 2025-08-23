-- Add missing columns to shops table
-- This migration adds all the columns that the application code references but are missing from the database schema

-- Add admin_notes column
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add business_license_number column if it doesn't exist
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS business_license_number TEXT;

-- Add tax_id column if it doesn't exist
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Add is_verified column if it doesn't exist
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Add business_type column if it doesn't exist (some shops might use 'type' instead)
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS business_type TEXT;

-- Add contact_email column if it doesn't exist (some shops might use 'email' instead)
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Add contact_phone column if it doesn't exist (some shops might use 'phone' instead)
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add description column if it doesn't exist (some shops might use 'shop_description' instead)
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add name column if it doesn't exist (some shops might use 'shop_name' instead)
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing rows to have empty values for new columns if NULL
UPDATE public.shops 
SET 
  admin_notes = COALESCE(admin_notes, ''),
  business_license_number = COALESCE(business_license_number, ''),
  tax_id = COALESCE(tax_id, ''),
  is_verified = COALESCE(is_verified, FALSE),
  business_type = COALESCE(business_type, ''),
  contact_email = COALESCE(contact_email, ''),
  contact_phone = COALESCE(contact_phone, ''),
  description = COALESCE(description, ''),
  name = COALESCE(name, '')
WHERE 
  admin_notes IS NULL OR 
  business_license_number IS NULL OR 
  tax_id IS NULL OR 
  is_verified IS NULL OR 
  business_type IS NULL OR 
  contact_email IS NULL OR 
  contact_phone IS NULL OR 
  description IS NULL OR 
  name IS NULL;

-- Make critical columns NOT NULL with default values
ALTER TABLE public.shops 
ALTER COLUMN admin_notes SET NOT NULL,
ALTER COLUMN admin_notes SET DEFAULT '',
ALTER COLUMN business_license_number SET NOT NULL,
ALTER COLUMN business_license_number SET DEFAULT '',
ALTER COLUMN tax_id SET NOT NULL,
ALTER COLUMN tax_id SET DEFAULT '',
ALTER COLUMN is_verified SET NOT NULL,
ALTER COLUMN is_verified SET DEFAULT FALSE,
ALTER COLUMN business_type SET NOT NULL,
ALTER COLUMN business_type SET DEFAULT '',
ALTER COLUMN contact_email SET NOT NULL,
ALTER COLUMN contact_email SET DEFAULT '',
ALTER COLUMN contact_phone SET NOT NULL,
ALTER COLUMN contact_phone SET DEFAULT '',
ALTER COLUMN description SET NOT NULL,
ALTER COLUMN description SET DEFAULT '',
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN name SET DEFAULT '';

-- Add comments to document the columns
COMMENT ON COLUMN public.shops.admin_notes IS 'Administrative notes and comments about the shop';
COMMENT ON COLUMN public.shops.business_license_number IS 'Business license number for the shop';
COMMENT ON COLUMN public.shops.tax_id IS 'Tax identification number for the shop';
COMMENT ON COLUMN public.shops.is_verified IS 'Whether the shop has been verified by admin';
COMMENT ON COLUMN public.shops.business_type IS 'Type of business (e.g., retail, service, etc.)';
COMMENT ON COLUMN public.shops.contact_email IS 'Primary contact email for the shop';
COMMENT ON COLUMN public.shops.contact_phone IS 'Primary contact phone for the shop';
COMMENT ON COLUMN public.shops.description IS 'Description of the shop and its services';
COMMENT ON COLUMN public.shops.name IS 'Name of the shop';

-- Verify all columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'shops' 
AND column_name IN ('admin_notes', 'business_license_number', 'tax_id', 'is_verified', 'business_type', 'contact_email', 'contact_phone', 'description', 'name')
ORDER BY column_name;
