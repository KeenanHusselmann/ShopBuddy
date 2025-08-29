-- Debug script to check shop search issue
-- This will help identify why the customer portal can't find "CK's Creations"

-- Check all shops in the database
SELECT 
  id,
  name,
  LENGTH(name) as name_length,
  name ILIKE '%CK%' as contains_ck,
  name ILIKE '%Creations%' as contains_creations,
  name ILIKE '%CK''s Creations%' as exact_match
FROM shops
ORDER BY name;

-- Check the specific shop that the customer profile references
SELECT 
  'Customer Profile Shop ID' as check_type,
  p.shop_id,
  s.name as shop_name,
  s.id as shop_id_from_shops
FROM profiles p
LEFT JOIN shops s ON p.shop_id = s.id
WHERE p.email = 'driventechnologies044@gmail.com';

-- Check if there are any shops with similar names
SELECT 
  'Similar Shop Names' as check_type,
  name,
  name ILIKE '%CK%' as has_ck,
  name ILIKE '%Creation%' as has_creation
FROM shops
WHERE name ILIKE '%CK%' OR name ILIKE '%Creation%';

-- Check the exact shop search that's failing
SELECT 
  'Shop Search Test' as check_type,
  'CK''s Creations' as search_term,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM shops 
      WHERE name ILIKE '%CK''s Creations%'
    ) THEN 'FOUND'
    ELSE 'NOT FOUND'
  END as search_result;
