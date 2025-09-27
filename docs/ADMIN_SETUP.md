# Admin Dashboard Setup Guide

## Overview
The ShopBuddy application now includes a comprehensive admin system for managing shop registration requests. This guide explains how to set up and use the admin functionality.

## Prerequisites
1. You must have a user account with `super_admin` role
2. The database migrations must be applied
3. The `shop_registration_requests` table must exist

## Setup Steps

### 1. Make Yourself a Super Admin
Run this SQL in your Supabase SQL editor:
```sql
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = 'YOUR_USER_ID'; -- Replace with your actual user ID
```

### 2. Access the Admin System
- **Admin Login**: `/admin-login` - Dedicated login page for super admins
- **Admin Dashboard**: `/admin` - Main admin interface (requires super admin role)

### 3. Database Verification
Run the `check-admin-db.sql` script in your Supabase SQL editor to verify:
- Table structure is correct
- RLS policies are in place
- Functions exist for approval/rejection

## Features

### Admin Login (`/admin-login`)
- Dedicated authentication for super admins
- Role verification before access
- Automatic redirect to admin dashboard

### Admin Dashboard (`/admin`)
- **Statistics Overview**: Count of pending, approved, rejected requests
- **Request Management**: View all shop registration requests
- **Approval/Rejection**: Process requests with notes and reasons
- **Logout**: Secure logout functionality
- **Refresh**: Manual refresh of data

### Shop Registration Flow
1. Shop owners register at `/shop-registration`
2. Requests appear in admin dashboard with "pending" status
3. Super admins can approve or reject with notes
4. Approved shops get created automatically
5. Users receive updated status

## Troubleshooting

### "Failed to load registration requests" Error
This usually means:
1. The `shop_registration_requests` table doesn't exist
2. RLS policies are blocking access
3. Database functions are missing

**Solution**: Run the database verification script and ensure all migrations are applied.

### No Admin Panel Button on Dashboard
**Check**: Your user role must be `super_admin`
**Solution**: Update your profile role using the SQL command above.

### Access Denied Errors
**Check**: Verify your user has the correct role
**Solution**: Ensure your profile has `role = 'super_admin'`

## Security Features
- Row Level Security (RLS) on all admin tables
- Role-based access control
- Secure authentication flow
- Audit logging for all admin actions

## Database Tables
- `shop_registration_requests`: Stores registration requests
- `profiles`: User profiles with role information
- `shops`: Created when registrations are approved
- `audit_logs`: Tracks all admin actions

## Next Steps
1. Test the admin login at `/admin-login`
2. Verify you can access the admin dashboard
3. Create a test shop registration to see the flow
4. Test approval/rejection functionality

## Support
If you encounter issues:
1. Check the browser console for errors
2. Verify database migrations are applied
3. Ensure your user has the correct role
4. Check RLS policies are properly configured
