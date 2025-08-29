# Fix Database Error: "column 'category' does not exist"

## Problem
You're getting this error:
```
ERROR: 42703: column "category" does not exist
```

This means the database tables haven't been created yet, or there's a mismatch between the expected schema and what's actually in the database.

## Solution

### Step 1: Run the Diagnostic and Fix Script

1. **Copy the content** from `docs/check-and-fix-database.sql`
2. **Run it in your Supabase SQL Editor** or database client
3. This script will:
   - Check what tables exist
   - Create missing tables
   - Add missing columns
   - Verify the final state

### Step 2: Alternative - Run the Complete Migration

If the diagnostic script doesn't work, run the complete migration:

1. **Copy the content** from `supabase/migrations/20250120000017_staff_dashboard_tables.sql`
2. **Run it in your Supabase SQL Editor**

### Step 3: Verify the Fix

After running either script, verify that:

1. **Products table exists** with all required columns
2. **Category column is present** in the products table
3. **All other tables are created** successfully

## What the Scripts Do

### Diagnostic Script (`check-and-fix-database.sql`)
- ✅ Checks current database state
- ✅ Creates missing tables
- ✅ Adds missing columns
- ✅ Verifies final state

### Complete Migration (`20250120000017_staff_dashboard_tables.sql`)
- ✅ Creates all required tables
- ✅ Sets up Row Level Security (RLS)
- ✅ Creates indexes for performance
- ✅ Inserts default data
- ✅ Sets up permissions

## Expected Result

After running the scripts, you should have these tables:
- `products` (with `category` column)
- `product_categories`
- `orders`
- `order_items`
- `customers`
- `pos_transactions`
- `notifications`
- `activity_logs`
- `inventory_transactions`
- `staff_permissions`
- `shop_settings`

## If You Still Get Errors

1. **Check if you have access** to the database
2. **Verify the database connection** is working
3. **Check if there are permission issues**
4. **Look for any syntax errors** in the SQL output

## Quick Test

After running the scripts, test with this simple query:

```sql
SELECT * FROM products LIMIT 1;
```

If this works without errors, the database is fixed!

## Need Help?

If you continue to have issues:
1. Check the error messages carefully
2. Verify your database connection
3. Make sure you're running the scripts in the correct database
4. Check if there are any existing tables that might conflict
