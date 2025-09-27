# Supabase Migration Instructions - Fix RLS Issues

## 🚨 **IMPORTANT: Apply This Migration to Fix Staff Invitation Errors**

The staff invitation system is currently failing due to Row Level Security (RLS) policies that prevent staff members from creating their profiles. This migration fixes those issues.

## 📋 **Migration File:**
`supabase/migrations/20250120000016_create_staff_profile_function.sql`

## 🔧 **What This Migration Does:**

1. **Creates `create_staff_profile` function** - Allows staff to create profiles with proper permissions
2. **Adds RLS policies** - Gives users permission to manage their own profiles
3. **Fixes permission issues** - Allows shop admins to view staff profiles

## 🚀 **How to Apply:**

### **Option 1: Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire content from `20250120000016_create_staff_profile_function.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the migration

### **Option 2: Supabase CLI**
```bash
# Navigate to your project directory
cd /path/to/your/project

# Apply the migration
supabase db push
```

## ✅ **After Applying:**

1. **Test staff invitation** - Try inviting a new staff member
2. **Check console** - Look for any remaining errors
3. **Verify profiles** - Staff should be able to create accounts successfully

## 🔍 **What Was Fixed:**

- ❌ **Before**: Staff members got 403 errors when trying to create profiles
- ✅ **After**: Staff members can create profiles using the database function
- ❌ **Before**: RLS policies blocked profile creation
- ✅ **After**: Proper RLS policies allow profile management

## 🆘 **If You Still Get Errors:**

1. **Check Supabase logs** - Look for function execution errors
2. **Verify RLS policies** - Ensure policies are active in the dashboard
3. **Test function manually** - Try calling `create_staff_profile` in SQL editor

## 📞 **Need Help?**

If you encounter any issues after applying this migration, please share:
- The exact error message
- Supabase dashboard logs
- Any console errors

---

**This migration is essential for the staff invitation system to work properly!** 🚀
