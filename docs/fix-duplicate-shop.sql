-- Fix duplicate shop issue
-- This script will remove the duplicate "CK's Creations" shop and update references

-- First, let's see what we're working with
SELECT 
  'Current Situation' as check_type,
  id,
  name,
  created_at
FROM shops 
WHERE name = 'CK''s Creations'
ORDER BY created_at;

-- Check which shop has the customer profile
SELECT 
  'Customer Profile Check' as check_type,
  p.shop_id,
  s.name as shop_name,
  s.created_at as shop_created
FROM profiles p
JOIN shops s ON p.shop_id = s.id
WHERE p.email = 'driventechnologies044@gmail.com';

-- Check which shop has the customer invitation
SELECT 
  'Customer Invitation Check' as check_type,
  sci.shop_id,
  s.name as shop_name,
  s.created_at as shop_created
FROM shop_customer_invitations sci
JOIN shops s ON sci.shop_id = s.id
WHERE sci.email = 'driventechnologies044@gmail.com';

-- Check which shop has the customer record
SELECT 
  'Customer Record Check' as check_type,
  c.shop_id,
  s.name as shop_name,
  s.created_at as shop_created
FROM customers c
JOIN shops s ON c.shop_id = s.id
WHERE c.email = 'driventechnologies044@gmail.com';

-- Now let's identify which shop to keep and which to remove
-- We'll keep the one that has the customer profile (e583d613-2277-4321-beb0-9e1ecab4b07b)
-- And remove the duplicate (bc04b7d8-6d89-4e8e-8809-6a0def494241)

-- Step 1: Update any references to the duplicate shop to point to the correct one
-- (This is a safety measure in case there are other references we haven't found)

-- Step 2: Remove the duplicate shop
-- DELETE FROM shops WHERE id = 'bc04b7d8-6d89-4e8e-8809-6a0def494241';

-- Note: Uncomment the DELETE statement above after verifying the results
-- and ensuring no other important data references the duplicate shop
