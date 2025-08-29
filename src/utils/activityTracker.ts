import { supabase } from '../integrations/supabase/client';

export interface Profile {
  first_name: string;
  last_name: string;
  role: string;
}

export interface ActivityLog {
  id?: string;
  shop_id: string;
  user_id: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  profiles?: Profile;
}

export interface LoginSession {
  id?: string;
  shop_id: string;
  user_id: string;
  login_time: string;
  logout_time?: string;
  session_duration?: number; // in minutes
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  profiles?: Profile;
}

export class ActivityTracker {
  private static instance: ActivityTracker;
  private currentSessionId: string | null = null;

  static getInstance(): ActivityTracker {
    if (!ActivityTracker.instance) {
      ActivityTracker.instance = new ActivityTracker();
    }
    return ActivityTracker.instance;
  }

  // Track user login
  async trackLogin(shopId: string, userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
    try {
      const loginTime = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('staff_login_sessions')
        .insert({
          shop_id: shopId,
          user_id: userId,
          login_time: loginTime,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .select('id')
        .single();

      if (error) throw error;
      
      this.currentSessionId = data.id;
      
      // Log the login activity
      await this.logActivity({
        shop_id: shopId,
        user_id: userId,
        action: 'user_login',
        table_name: 'staff_login_sessions',
        record_id: data.id,
        metadata: { session_id: data.id, login_time: loginTime }
      });

      return data.id;
    } catch (error) {
      console.error('Error tracking login:', error);
      throw error;
    }
  }

  // Track user logout
  async trackLogout(shopId: string, userId: string): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      const logoutTime = new Date().toISOString();
      
      // Update the session with logout time
      const { error: sessionError } = await supabase
        .from('staff_login_sessions')
        .update({
          logout_time: logoutTime,
          session_duration: this.calculateSessionDuration(this.currentSessionId)
        })
        .eq('id', this.currentSessionId);

      if (sessionError) throw sessionError;

      // Log the logout activity
      await this.logActivity({
        shop_id: shopId,
        user_id: userId,
        action: 'user_logout',
        table_name: 'staff_login_sessions',
        record_id: this.currentSessionId,
        metadata: { session_id: this.currentSessionId, logout_time: logoutTime }
      });

      this.currentSessionId = null;
    } catch (error) {
      console.error('Error tracking logout:', error);
      throw error;
    }
  }

  // Track any activity performed by staff
  async logActivity(activity: ActivityLog): Promise<void> {
    try {
      const { error } = await supabase
        .from('staff_activity_logs')
        .insert({
          ...activity,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw here to avoid breaking the main functionality
    }
  }

  // Track product-related activities
  async trackProductActivity(
    shopId: string,
    userId: string,
    action: 'product_created' | 'product_updated' | 'product_deleted' | 'product_viewed',
    productId: string,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    await this.logActivity({
      shop_id: shopId,
      user_id: userId,
      action,
      table_name: 'products',
      record_id: productId,
      old_values: oldValues,
      new_values: newValues,
      metadata: { product_id: productId }
    });
  }

  // Track order-related activities
  async trackOrderActivity(
    shopId: string,
    userId: string,
    action: 'order_created' | 'order_updated' | 'order_status_changed' | 'order_viewed',
    orderId: string,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    await this.logActivity({
      shop_id: shopId,
      user_id: userId,
      action,
      table_name: 'orders',
      record_id: orderId,
      old_values: oldValues,
      new_values: newValues,
      metadata: { order_id: orderId }
    });
  }

  // Track customer-related activities
  async trackCustomerActivity(
    shopId: string,
    userId: string,
    action: 'customer_created' | 'customer_updated' | 'customer_deleted' | 'customer_viewed',
    customerId: string,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    await this.logActivity({
      shop_id: shopId,
      user_id: userId,
      action,
      table_name: 'customers',
      record_id: customerId,
      old_values: oldValues,
      new_values: newValues,
      metadata: { customer_id: customerId }
    });
  }

  // Track POS transactions
  async trackPOSTransaction(
    shopId: string,
    userId: string,
    action: 'pos_sale' | 'pos_return' | 'pos_refund',
    transactionId: string,
    amount: number,
    metadata?: any
  ): Promise<void> {
    await this.logActivity({
      shop_id: shopId,
      user_id: userId,
      action,
      table_name: 'pos_transactions',
      record_id: transactionId,
      new_values: { amount, transaction_id: transactionId },
      metadata: { ...metadata, amount, transaction_id: transactionId }
    });
  }

  // Track inventory changes
  async trackInventoryActivity(
    shopId: string,
    userId: string,
    action: 'stock_adjusted' | 'inventory_counted' | 'low_stock_alert',
    productId: string,
    quantity: number,
    metadata?: any
  ): Promise<void> {
    await this.logActivity({
      shop_id: shopId,
      user_id: userId,
      action,
      table_name: 'inventory',
      record_id: productId,
      new_values: { quantity, product_id: productId },
      metadata: { ...metadata, quantity, product_id: productId }
    });
  }

  // Get user's recent activities
  async getUserRecentActivities(shopId: string, userId: string, limit: number = 50): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('staff_activity_logs')
        .select('*')
        .eq('shop_id', shopId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  }

  // Get shop's recent activities (for shop owners)
  async getShopRecentActivities(shopId: string, limit: number = 100): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('staff_activity_logs')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            role
          )
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shop activities:', error);
      return [];
    }
  }

  // Get staff login sessions for a shop
  async getShopLoginSessions(shopId: string, limit: number = 100): Promise<LoginSession[]> {
    try {
      const { data, error } = await supabase
        .from('staff_login_sessions')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            role
          )
        `)
        .eq('shop_id', shopId)
        .order('login_time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching login sessions:', error);
      return [];
    }
  }

  // Get current active sessions for a shop
  async getActiveSessions(shopId: string): Promise<LoginSession[]> {
    try {
      const { data, error } = await supabase
        .from('staff_login_sessions')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            role
          )
        `)
        .eq('shop_id', shopId)
        .is('logout_time', null)
        .order('login_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return [];
    }
  }

  private calculateSessionDuration(sessionId: string): number {
    // This would need to be implemented based on your session tracking logic
    // For now, return 0 and let the database calculate it
    return 0;
  }

  // Get current session ID
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }
}

// Export singleton instance
export const activityTracker = ActivityTracker.getInstance();
