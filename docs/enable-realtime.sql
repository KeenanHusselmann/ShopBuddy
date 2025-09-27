-- Enable Real-time Subscriptions for Orders Table
-- This allows customers to see live updates when shop owners change order status

-- 1. Enable real-time on the orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 2. Verify real-time is enabled
SELECT 
    schemaname,
    tablename,
    hasreplindex,
    hasrepltrigger
FROM pg_stat_user_tables 
WHERE tablename = 'orders';

-- 3. Check current publication settings
SELECT 
    pubname,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- 4. If supabase_realtime publication doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
        RAISE NOTICE 'Created supabase_realtime publication';
    ELSE
        RAISE NOTICE 'supabase_realtime publication already exists';
    END IF;
END $$;

-- 5. Ensure orders table is included in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 6. Verify the orders table is now in the publication
SELECT 
    p.pubname,
    c.relname as tablename
FROM pg_publication p
JOIN pg_publication_tables pt ON p.oid = pt.pubpubid
JOIN pg_class c ON pt.pubtableid = c.oid
WHERE p.pubname = 'supabase_realtime'
AND c.relname = 'orders';

-- 7. Test real-time functionality by checking if the table has the necessary triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'orders';

-- 8. Show final status
DO $$
BEGIN
    RAISE NOTICE 'Real-time setup complete for orders table!';
    RAISE NOTICE 'Customers will now see live updates when order status changes.';
END $$;
