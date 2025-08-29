# Staff Activity Tracking System Setup Guide

## Overview

The Staff Activity Tracking System provides comprehensive monitoring of all staff activities, login/logout sessions, and system access within your shop. This system is designed to give shop owners complete visibility into staff operations while maintaining security and privacy.

## Features

### 🔍 **Activity Tracking**
- **Product Operations**: Create, update, delete, view products
- **Order Management**: Order creation, status changes, modifications
- **Customer Operations**: Customer management activities
- **POS Transactions**: Sales, returns, refunds
- **Inventory Changes**: Stock adjustments, counting, alerts
- **System Access**: Login/logout tracking with timestamps

### 📊 **Session Management**
- **Login Tracking**: Record login time, IP address, user agent
- **Logout Tracking**: Session duration calculation
- **Active Sessions**: Real-time view of currently logged-in staff
- **Session History**: Complete audit trail of all sessions

### 🛡️ **Security & Permissions**
- **Role-Based Access**: Different permissions for staff vs. shop owners
- **Row Level Security**: Data isolation between shops
- **Audit Trail**: Complete history of all actions
- **IP Tracking**: Monitor access locations

## Database Setup

### Step 1: Apply the Activity Tracking Tables

Run the SQL script `docs/apply-activity-tracking.sql` in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content of apply-activity-tracking.sql
-- This will create all necessary tables, policies, and functions
```

### Step 2: Verify Setup

After running the script, verify that these tables were created:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'staff_activity_logs',
    'staff_login_sessions', 
    'staff_permissions',
    'shop_settings'
);
```

### Step 3: Check RLS Policies

Verify that Row Level Security is properly configured:

```sql
-- Check RLS policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
    'staff_activity_logs',
    'staff_login_sessions', 
    'staff_permissions',
    'shop_settings'
);
```

## Frontend Integration

### 1. Activity Tracker Utility

The system uses a centralized `ActivityTracker` class located at `src/utils/activityTracker.ts`. This utility provides:

- **Login/Logout Tracking**: Automatic session management
- **Activity Logging**: Centralized activity recording
- **Data Retrieval**: Methods to fetch activity data
- **Real-time Updates**: Supabase real-time subscriptions

### 2. Staff Dashboard Integration

The `ShopStaffDashboard` component automatically:

- Tracks login when staff members sign in
- Records logout when they sign out
- Shows recent activities
- Displays active sessions
- Provides real-time updates

### 3. Shop Owner Dashboard

The `ShopOwnerDashboard` component provides:

- **Comprehensive Activity View**: All staff activities across the shop
- **Session Monitoring**: Real-time view of active staff sessions
- **Activity Filtering**: Search and filter by staff member, action type, date
- **Export Functionality**: CSV export of activity logs
- **Performance Metrics**: Staff activity summaries

## Usage Examples

### Tracking Product Activities

```typescript
import { activityTracker } from '../utils/activityTracker';

// When a staff member creates a product
await activityTracker.trackProductActivity(
  shopId,
  userId,
  'product_created',
  productId,
  undefined, // old values
  newProductData // new values
);

// When updating a product
await activityTracker.trackProductActivity(
  shopId,
  userId,
  'product_updated',
  productId,
  oldProductData, // old values
  updatedProductData // new values
);
```

### Tracking Order Activities

```typescript
// When order status changes
await activityTracker.trackOrderActivity(
  shopId,
  userId,
  'order_status_changed',
  orderId,
  { status: 'pending' }, // old values
  { status: 'processing' } // new values
);
```

### Tracking POS Transactions

```typescript
// When a sale is completed
await activityTracker.trackPOSTransaction(
  shopId,
  userId,
  'pos_sale',
  transactionId,
  totalAmount,
  { 
    payment_method: 'card',
    items_count: 3 
  }
);
```

## Real-time Features

### 1. Live Activity Updates

The system uses Supabase real-time subscriptions to provide instant updates:

```typescript
const subscription = supabase
  .channel('staff_activities')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'staff_activity_logs',
      filter: `shop_id=eq.${shop.id}`
    }, 
    (payload) => {
      // New activity detected - refresh the display
      fetchRecentActivities();
    }
  )
  .subscribe();
```

### 2. Active Session Monitoring

Shop owners can see in real-time:
- Who is currently logged in
- When they logged in
- Their IP address
- Session duration

## Security Considerations

### 1. Data Isolation

- Each shop can only see their own staff activities
- Staff members can only see their own activities
- Shop owners have full visibility across their shop

### 2. Privacy Protection

- IP addresses are logged for security but not displayed to other staff
- Sensitive data (passwords, etc.) is never logged
- Activity logs respect user privacy settings

### 3. Access Control

- RLS policies ensure data security
- Only authenticated users can access activity data
- Role-based permissions control access levels

## Performance Optimization

### 1. Database Indexes

The system automatically creates indexes for:
- `shop_id` - Fast shop-specific queries
- `user_id` - Fast user-specific queries
- `created_at` - Fast time-based queries
- `action` - Fast action-type filtering

### 2. Efficient Queries

- Uses `LIMIT` clauses to prevent large data fetches
- Implements pagination for large activity logs
- Optimized JOIN queries with proper indexing

### 3. Caching Strategy

- Recent activities are cached in component state
- Real-time updates refresh only necessary data
- Efficient re-rendering with React state management

## Monitoring and Analytics

### 1. Activity Summary

Use the `get_staff_activity_summary` function to get insights:

```sql
SELECT get_staff_activity_summary('your-shop-id', 30);
```

This returns:
- Total logins in the last 30 days
- Total activities performed
- Currently active sessions
- Top 5 most common actions

### 2. Custom Queries

You can create custom analytics queries:

```sql
-- Staff productivity by day
SELECT 
  DATE(created_at) as activity_date,
  COUNT(*) as total_activities,
  COUNT(DISTINCT user_id) as active_staff
FROM staff_activity_logs 
WHERE shop_id = 'your-shop-id'
GROUP BY DATE(created_at)
ORDER BY activity_date DESC;

-- Most active staff members
SELECT 
  p.first_name,
  p.last_name,
  COUNT(*) as activity_count
FROM staff_activity_logs sal
JOIN profiles p ON sal.user_id = p.id
WHERE sal.shop_id = 'your-shop-id'
GROUP BY p.id, p.first_name, p.last_name
ORDER BY activity_count DESC;
```

## Troubleshooting

### Common Issues

#### 1. Activities Not Being Tracked

**Problem**: Staff activities are not appearing in the logs.

**Solution**: Check that:
- The `staff_activity_logs` table exists
- RLS policies are properly configured
- The `activityTracker.logActivity()` method is being called
- User has proper permissions

#### 2. Login Sessions Not Recording

**Problem**: Staff login/logout times are not being tracked.

**Solution**: Verify that:
- The `staff_login_sessions` table exists
- `activityTracker.trackLogin()` is called during sign-in
- `activityTracker.trackLogout()` is called during sign-out

#### 3. Permission Errors

**Problem**: Users getting permission denied errors.

**Solution**: Check that:
- RLS policies are correctly set up
- User roles are properly assigned
- Shop ID relationships are correct

### Debug Queries

Use these queries to diagnose issues:

```sql
-- Check if activity tracking is working
SELECT COUNT(*) as total_activities 
FROM staff_activity_logs 
WHERE shop_id = 'your-shop-id';

-- Check recent login sessions
SELECT * FROM staff_login_sessions 
WHERE shop_id = 'your-shop-id' 
ORDER BY login_time DESC 
LIMIT 10;

-- Verify RLS policies
SELECT tablename, policyname, cmd, permissive 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Best Practices

### 1. Activity Tracking

- **Track Everything**: Log all significant staff actions
- **Include Context**: Store relevant metadata with activities
- **Performance**: Use async/await to prevent blocking operations
- **Error Handling**: Don't let tracking failures break main functionality

### 2. Data Management

- **Regular Cleanup**: Archive old activity logs periodically
- **Backup Strategy**: Include activity logs in your backup routine
- **Monitoring**: Set up alerts for unusual activity patterns

### 3. User Experience

- **Real-time Updates**: Provide instant feedback for new activities
- **Efficient Filtering**: Implement fast search and filter capabilities
- **Export Options**: Allow data export for compliance and analysis

## Future Enhancements

### Planned Features

1. **Advanced Analytics**: Machine learning-based activity pattern analysis
2. **Mobile Notifications**: Push notifications for important activities
3. **Integration APIs**: Webhook support for external system integration
4. **Custom Dashboards**: Configurable activity monitoring dashboards
5. **Compliance Reporting**: Automated compliance and audit reports

### Customization Options

The system is designed to be extensible:
- Add new activity types easily
- Customize tracking metadata
- Implement custom analytics functions
- Integrate with external monitoring tools

## Support and Maintenance

### Regular Maintenance

1. **Database Optimization**: Run `VACUUM` and `ANALYZE` periodically
2. **Index Monitoring**: Check index usage and performance
3. **Policy Review**: Regularly review and update RLS policies
4. **Performance Monitoring**: Monitor query performance and optimize as needed

### Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review the database setup verification queries
3. Check the browser console for JavaScript errors
4. Verify Supabase connection and permissions

---

**Note**: This activity tracking system is designed to provide comprehensive monitoring while maintaining user privacy and system performance. Always ensure compliance with local data protection regulations when implementing activity tracking.
