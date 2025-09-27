# Database Tables Documentation

This document outlines all the database tables created for the Shop Buddy application, including the staff dashboard features.

## Core Tables

### 1. **profiles** (User Profiles)
- **Purpose**: Stores user profile information for all user types
- **Key Fields**: `id`, `first_name`, `last_name`, `email`, `role`, `shop_id`, `shop_registration_status`
- **Roles**: `super_admin`, `shop_admin`, `staff`, `customer`

### 2. **shops** (Shop Information)
- **Purpose**: Stores shop/business information
- **Key Fields**: `id`, `name`, `description`, `address`, `phone`, `email`, `is_verified`, `status`

### 3. **staff_invitations** (Staff Invitation System)
- **Purpose**: Manages staff invitation process
- **Key Fields**: `id`, `shop_id`, `invited_by`, `email`, `first_name`, `last_name`, `role`, `invitation_token`, `status`

### 4. **staff_credentials** (Staff Login Credentials)
- **Purpose**: Stores staff member login credentials
- **Key Fields**: `id`, `staff_id`, `email`, `password_hash`, `is_active`, `last_login`

## Staff Dashboard Tables

### 5. **products** (Product Inventory)
- **Purpose**: Manages shop product catalog
- **Key Fields**: 
  - `id`, `shop_id`, `name`, `description`, `sku`, `barcode`
  - `category`, `product_type`, `price`, `cost_price`, `sale_price`
  - `stock_quantity`, `min_stock_level`, `max_stock_level`
  - `unit`, `weight`, `dimensions`, `images`, `tags`
  - `is_active`, `is_featured`, `created_by`, `updated_by`

### 6. **product_categories** (Product Organization)
- **Purpose**: Organizes products into categories
- **Key Fields**: `id`, `shop_id`, `name`, `description`, `parent_category_id`, `image_url`, `is_active`, `sort_order`

### 7. **orders** (Customer Orders)
- **Purpose**: Tracks customer orders
- **Key Fields**:
  - `id`, `shop_id`, `order_number`, `customer_id`
  - `customer_name`, `customer_email`, `customer_phone`
  - `order_type`, `status`, `payment_status`, `payment_method`
  - `subtotal`, `tax_amount`, `discount_amount`, `shipping_amount`, `total_amount`
  - `notes`, `internal_notes`, `order_date`, `expected_delivery`, `actual_delivery`
  - `created_by`, `updated_by`

### 8. **order_items** (Order Line Items)
- **Purpose**: Individual items within orders
- **Key Fields**: `id`, `order_id`, `product_id`, `product_name`, `product_sku`, `quantity`, `unit_price`, `total_price`, `discount_amount`, `notes`

### 9. **customers** (Customer Management)
- **Purpose**: Manages customer information
- **Key Fields**:
  - `id`, `shop_id`, `first_name`, `last_name`, `email`, `phone`, `address`
  - `date_of_birth`, `gender`, `customer_type`
  - `loyalty_points`, `total_spent`, `last_order_date`
  - `notes`, `tags`, `is_active`, `created_by`, `updated_by`

### 10. **pos_transactions** (Point of Sale System)
- **Purpose**: Tracks POS transactions
- **Key Fields**:
  - `id`, `shop_id`, `transaction_number`, `order_id`, `customer_id`, `staff_id`
  - `transaction_type`, `payment_method`
  - `subtotal`, `tax_amount`, `discount_amount`, `total_amount`
  - `amount_paid`, `change_amount`, `status`, `notes`

### 11. **notifications** (Real-time Notifications)
- **Purpose**: Manages notifications between staff and shop owners
- **Key Fields**:
  - `id`, `shop_id`, `recipient_id`, `sender_id`
  - `type`, `title`, `message`, `data`
  - `is_read`, `priority`, `expires_at`, `read_at`

### 12. **activity_logs** (Staff Activity Tracking)
- **Purpose**: Logs all staff activities for audit purposes
- **Key Fields**:
  - `id`, `shop_id`, `user_id`, `action`, `table_name`, `record_id`
  - `old_values`, `new_values`, `metadata`
  - `ip_address`, `user_agent`, `created_at`

### 13. **inventory_transactions** (Stock Tracking)
- **Purpose**: Tracks all inventory movements
- **Key Fields**:
  - `id`, `shop_id`, `product_id`, `transaction_type`
  - `quantity`, `unit_cost`, `total_cost`
  - `reference_type`, `reference_id`, `notes`, `performed_by`

### 14. **staff_permissions** (Role-based Access Control)
- **Purpose**: Controls what staff members can do
- **Key Fields**:
  - `id`, `shop_id`, `staff_id`, `permission_type`
  - `can_view`, `can_create`, `can_edit`, `can_delete`, `can_approve`
- **Permission Types**: `products`, `orders`, `customers`, `inventory`, `reports`, `settings`, `pos`, `staff_management`

### 15. **shop_settings** (Shop Configuration)
- **Purpose**: Stores shop-specific configuration
- **Key Fields**: `id`, `shop_id`, `setting_key`, `setting_value`, `setting_type`, `description`, `is_public`

## Additional Tables

### 16. **customer_accounts** (Customer Authentication)
- **Purpose**: Customer login accounts
- **Key Fields**: `id`, `shop_id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `address`, `email_verified`

### 17. **customer_profiles** (Customer Preferences)
- **Purpose**: Additional customer information
- **Key Fields**: `id`, `customer_id`, `preferences`, `loyalty_points`, `total_spent`, `favorite_categories`, `notes`

### 18. **customer_orders** (Customer Order History)
- **Purpose**: Customer-specific order tracking
- **Key Fields**: `id`, `customer_id`, `shop_id`, `order_number`, `status`, `total_amount`, `items`, `payment_status`

### 19. **customer_debt** (Customer Credit Tracking)
- **Purpose**: Tracks customer debt and credit
- **Key Fields**: `id`, `customer_id`, `shop_id`, `amount`, `debt_type`, `due_date`, `interest_rate`, `status`

### 20. **customer_spending_habits** (Customer Analytics)
- **Purpose**: Analyzes customer spending patterns
- **Key Fields**: `id`, `customer_id`, `shop_id`, `month_year`, `total_spent`, `order_count`, `average_order_value`, `favorite_products`

### 21. **shop_registration_requests** (Shop Registration)
- **Purpose**: Manages shop registration process
- **Key Fields**: `id`, `user_id`, `shop_name`, `business_address`, `contact_phone`, `contact_email`, `status`, `admin_notes`

### 22. **audit_logs** (System Audit Trail)
- **Purpose**: System-wide audit logging
- **Key Fields**: `id`, `shop_id`, `user_id`, `user_name`, `user_role`, `action`, `table_name`, `record_id`, `new_values`, `metadata`

## Database Functions

### Core Functions
- `create_staff_profile()` - Creates staff profiles
- `invite_staff_member()` - Sends staff invitations
- `accept_staff_invitation()` - Processes staff invitation acceptance
- `create_customer_account()` - Creates customer accounts
- `approve_shop_registration()` - Approves shop registrations
- `reject_shop_registration()` - Rejects shop registrations

### Staff Dashboard Functions
- `create_product()` - Creates new products with permission checks
- `create_order()` - Creates new orders with permission checks
- `create_customer()` - Creates new customers with permission checks
- `create_notification()` - Creates notifications
- `mark_notification_read()` - Marks notifications as read

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- **Shop Staff**: Can view and manage data within their shop
- **Shop Admins**: Have full access to their shop data
- **Super Admins**: Have access to all data
- **Users**: Can only access their own data

## Indexes

Comprehensive indexing is implemented for:
- Foreign key relationships
- Frequently queried fields
- Search and filter operations
- Date-based queries
- Status-based queries

## Data Relationships

- **One-to-Many**: Shop → Products, Orders, Customers, Staff
- **Many-to-Many**: Products ↔ Categories (via category field)
- **One-to-One**: Customer ↔ Customer Profile
- **Hierarchical**: Product Categories (parent-child relationships)

## Default Data

The migration includes:
- Default shop settings for POS configuration
- Default staff permissions for existing staff members
- Sample data structures for testing

## Security Features

- **Row Level Security (RLS)** on all tables
- **Permission-based access control** for staff members
- **Audit logging** for all data changes
- **Input validation** through check constraints
- **Secure function execution** with SECURITY DEFINER
