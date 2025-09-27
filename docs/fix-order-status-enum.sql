-- Fix Order Status Enum Values
-- This script checks and updates the order status enum to include all needed values

-- 1. Check current enum values
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Checking current order_status enum values...';
    
    -- Get the enum type name
    FOR r IN 
        SELECT t.typname, e.enumlabel
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname LIKE '%order_status%' OR t.typname LIKE '%status%'
        ORDER BY t.typname, e.enumsortorder
    LOOP
        RAISE NOTICE 'Enum type: %, Value: %', r.typname, r.enumlabel;
    END LOOP;
END $$;

-- 2. Check what columns use enum types
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'status';

-- 3. Check current constraints on the status column
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.orders'::regclass 
AND contype = 'c';

-- 4. Drop existing enum constraints if they exist
DO $$
DECLARE
    enum_type_name text;
    constraint_name text;
    r RECORD;
BEGIN
    -- Find the enum type name
    SELECT udt_name INTO enum_type_name
    FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'status';
    
    IF enum_type_name IS NOT NULL THEN
        RAISE NOTICE 'Found enum type: %', enum_type_name;
        
        -- Find and drop check constraints
        FOR r IN 
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'public.orders'::regclass 
            AND contype = 'c'
            AND pg_get_constraintdef(oid) LIKE '%' || enum_type_name || '%'
        LOOP
            RAISE NOTICE 'Dropping constraint: %', r.conname;
            EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT ' || r.conname;
        END LOOP;
    END IF;
END $$;

-- 5. Update the status column to use text type with check constraint
ALTER TABLE public.orders 
ALTER COLUMN status TYPE text;

-- 6. Add a check constraint with all the status values we need
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
    'pending',
    'confirmed', 
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
));

-- 7. Set default value
ALTER TABLE public.orders 
ALTER COLUMN status SET DEFAULT 'pending';

-- 8. Verify the changes
SELECT 
    table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'status';

-- 9. Check the new constraint
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.orders'::regclass 
AND conname = 'orders_status_check';

-- 10. Test inserting with different status values
DO $$
BEGIN
    RAISE NOTICE 'Testing status values...';
    
    -- Test each status value
    BEGIN
        UPDATE public.orders SET status = 'pending' WHERE id = (SELECT id FROM public.orders LIMIT 1);
        RAISE NOTICE 'Status "pending" - OK';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Status "pending" - FAILED: %', SQLERRM;
    END;
    
    BEGIN
        UPDATE public.orders SET status = 'confirmed' WHERE id = (SELECT id FROM public.orders LIMIT 1);
        RAISE NOTICE 'Status "confirmed" - OK';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Status "confirmed" - FAILED: %', SQLERRM;
    END;
    
    BEGIN
        UPDATE public.orders SET status = 'processing' WHERE id = (SELECT id FROM public.orders LIMIT 1);
        RAISE NOTICE 'Status "processing" - OK';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Status "processing" - FAILED: %', SQLERRM;
    END;
    
    BEGIN
        UPDATE public.orders SET status = 'shipped' WHERE id = (SELECT id FROM public.orders LIMIT 1);
        RAISE NOTICE 'Status "shipped" - OK';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Status "shipped" - FAILED: %', SQLERRM;
    END;
    
    BEGIN
        UPDATE public.orders SET status = 'delivered' WHERE id = (SELECT id FROM public.orders LIMIT 1);
        RAISE NOTICE 'Status "delivered" - OK';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Status "delivered" - FAILED: %', SQLERRM;
    END;
    
    BEGIN
        UPDATE public.orders SET status = 'cancelled' WHERE id = (SELECT id FROM public.orders LIMIT 1);
        RAISE NOTICE 'Status "cancelled" - OK';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Status "cancelled" - FAILED: %', SQLERRM;
    END;
    
    BEGIN
        UPDATE public.orders SET status = 'refunded' WHERE id = (SELECT id FROM public.orders LIMIT 1);
        RAISE NOTICE 'Status "refunded" - OK';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Status "refunded" - FAILED: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Status testing complete!';
END $$;
