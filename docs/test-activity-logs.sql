-- Test Activity Logs Table
-- Run this script to verify the table is working

-- 1. Check if the table exists
SELECT 'Table exists' as status, COUNT(*) as row_count 
FROM information_schema.tables 
WHERE table_name = 'activity_logs';

-- 2. Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'activity_logs'
ORDER BY ordinal_position;

-- 3. Check if we can insert a test record
INSERT INTO public.activity_logs (
    shop_id, 
    action, 
    details, 
    table_name, 
    created_at
) VALUES (
    'e583d613-2277-4321-beb0-9e1ecab4b07b',  -- Replace with your actual shop_id
    'test_action',
    '{"message": "Test notification"}',
    'test',
    NOW()
);

-- 4. Check if we can read the test record
SELECT * FROM public.activity_logs 
WHERE action = 'test_action' 
ORDER BY created_at DESC 
LIMIT 1;

-- 5. Clean up test record
DELETE FROM public.activity_logs WHERE action = 'test_action';

-- 6. Show current activity logs count
SELECT 'Current activity logs count' as status, COUNT(*) as count 
FROM public.activity_logs;
