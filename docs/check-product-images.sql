-- Check Product Images Structure
-- This script helps diagnose image display issues

-- Check the current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('images', 'image_url')
ORDER BY column_name;

-- Check if images field exists and what it contains
SELECT 
    'images_field_exists' as check_type,
    CASE 
        WHEN column_name = 'images' THEN 'YES'
        ELSE 'NO'
    END as status
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'images';

-- Check if image_url field exists
SELECT 
    'image_url_field_exists' as check_type,
    CASE 
        WHEN column_name = 'image_url' THEN 'YES'
        ELSE 'NO'
    END as status
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'image_url';

-- Sample some product data to see what's in the images field
SELECT 
    id,
    name,
    images,
    CASE 
        WHEN images IS NULL THEN 'NULL'
        WHEN images = '[]' THEN 'EMPTY_ARRAY'
        WHEN jsonb_typeof(images) = 'array' THEN 'ARRAY_WITH_' || jsonb_array_length(images) || '_ITEMS'
        WHEN jsonb_typeof(images) = 'object' THEN 'OBJECT_WITH_' || jsonb_object_keys(images) || '_KEYS'
        ELSE 'OTHER_TYPE: ' || jsonb_typeof(images)
    END as images_status
FROM products 
LIMIT 5;

-- Check for any products with actual image data
SELECT 
    'products_with_images' as check_type,
    COUNT(*) as total_products,
    COUNT(CASE WHEN images IS NOT NULL AND images != '[]' THEN 1 END) as products_with_images,
    COUNT(CASE WHEN images IS NULL OR images = '[]' THEN 1 END) as products_without_images
FROM products;
