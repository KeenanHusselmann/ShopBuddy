import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Users, 
  Activity,
  Clock,
  Bell,
  AlertCircle,
  Download,
  RefreshCw,
  Search,
  ArrowLeft,
  Building2,
  LogOut
} from 'lucide-react';
import { activityTracker, ActivityLog, LoginSession } from '../utils/activityTracker';

interface StaffActivity {
  id: string;
  action: string;
  table_name?: string;
  record_id?: string;
  metadata?: any;
  created_at: string;
  user_name?: string;
  user_role?: string;
}

const StaffActivity: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loginSessions, setLoginSessions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && shop) {
      fetchRecentActivities();
      // Set up real-time subscription for activities
      const subscription = supabase
        .channel('owner_activities')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'staff_activity_logs',
            filter: `shop_id=eq.${shop.id}`
          }, 
          (payload) => {
            console.log('New activity detected:', payload);
            fetchRecentActivities(); // Refresh activities
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, shop]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found, redirecting to auth');
        navigate('/shop-owner-auth');
        return;
      }

      console.log('👤 User found:', user.id);
      setUser(user);

      // Get user profile and shop info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, shops(*)')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        navigate('/shop-owner-auth');
        return;
      }

      console.log('📋 Profile data:', profile);
      console.log('🏪 Shop data:', profile?.shops);

      if (profile && profile.shops && profile.role === 'shop_admin') {
        console.log('✅ Shop admin confirmed, setting shop:', profile.shops);
        setShop(profile.shops);
      } else {
        console.log('❌ Not shop admin or no shop, redirecting');
        navigate('/shop-owner-auth');
      }
    } catch (error) {
      console.error('❌ Error checking user:', error);
      navigate('/shop-owner-auth');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    if (!shop) return;

    try {
      console.log('🔍 Fetching activities for shop:', shop.id);
      
      // Fetch all staff activities first
      const { data: activities, error } = await supabase
        .from('staff_activity_logs')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            role
          )
        `)
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Supabase error:', error);
        return;
      }

      console.log('📊 Raw activities from database:', activities);
      console.log('📊 Activities count:', activities?.length || 0);
      
      // Log each activity in detail
      if (activities && activities.length > 0) {
        console.log('🔍 Detailed activity breakdown:');
        activities.forEach((activity, index) => {
          console.log(`  Activity ${index + 1}:`, {
            id: activity.id,
            action: activity.action,
            table_name: activity.table_name,
            record_id: activity.record_id,
            user_id: activity.user_id,
            profiles: activity.profiles
          });
        });
      }

      // Filter out raw login entries in JavaScript
      let allActivities = [];
      let loginActivities = [];
      let notificationActivities = [];

      if (activities && activities.length > 0) {
        // First, let's see what actions we actually have
        console.log('🔍 All action types found:', [...new Set(activities.map(a => a.action))]);
        
        // Categorize activities
        activities.forEach(activity => {
          const formattedActivity = {
            id: activity.id,
            type: 'activity',
            action: activity.action,
            table_name: activity.table_name,
            record_id: activity.record_id,
            metadata: activity.metadata,
            created_at: activity.created_at,
            user_id: activity.user_id,
            user_name: activity.profiles ? `${activity.profiles.first_name} ${activity.profiles.last_name}` : 'Unknown User',
            user_role: activity.profiles?.role || 'Unknown Role',
            description: getNormalizedDescription(activity)
          };

          // Categorize based on action type
          if (activity.action.includes('low_stock') || activity.action.includes('alert')) {
            notificationActivities.push(formattedActivity);
          } else {
            // All activities (including login/logout) go to the main Staff Activity Log
            // This ensures we show data while waiting for business activities
            allActivities.push(formattedActivity);
          }
        });
        
        console.log('🔍 Login activities count:', loginActivities.length);
        console.log('🔍 Notification activities count:', notificationActivities.length);
        console.log('🔍 General activities count:', allActivities.length);
      }

      console.log('📝 Final formatted activities:', allActivities);
      console.log('📝 Final activities count:', allActivities.length);

      // Sort all activities by timestamp (most recent first)
      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      loginActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      notificationActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRecentActivities(allActivities);
      setLoginSessions(loginActivities);
      setNotifications(notificationActivities);
    } catch (error) {
      console.error('❌ Error fetching activities:', error);
    }
  };

  const exportActivityLog = async () => {
    if (!shop) return;

    try {
      // Fetch all staff activities first
      const { data: activities } = await supabase
        .from('staff_activity_logs')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            role
          )
        `)
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

      // Filter out raw login entries in JavaScript
      let allActivities = [];

      if (activities) {
        const filteredActivities = activities.filter(activity => 
          activity.action !== 'user_login' && activity.action !== 'user_logout'
        );

        const formattedActivities = filteredActivities.map(activity => ({
          type: 'activity',
          action: activity.action,
          table_name: activity.table_name,
          record_id: activity.record_id,
          metadata: activity.metadata,
          created_at: activity.created_at,
          user_name: activity.profiles ? `${activity.profiles.first_name} ${activity.profiles.last_name}` : 'Unknown',
          user_role: activity.profiles?.role || 'Unknown',
          description: getNormalizedDescription(activity)
        }));
        allActivities.push(...formattedActivities);
      }

      // Sort by timestamp
      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (allActivities.length > 0) {
        const csvContent = [
          ['Date', 'Type', 'Staff Name', 'Role', 'Action', 'Description', 'Table', 'Record ID', 'Metadata'],
          ...allActivities.map(activity => [
            new Date(activity.created_at).toLocaleString(),
            'Activity',
            activity.user_name,
            activity.user_role,
            activity.action,
            activity.description,
            activity.table_name || '',
            activity.record_id || '',
            JSON.stringify(activity.metadata || {})
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `staff_activity_log_${shop.name}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting activity log:', error);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('login') || action.includes('logout')) return 'bg-blue-100 text-blue-600';
    if (action.includes('create') || action.includes('insert')) return 'bg-green-100 text-green-600';
    if (action.includes('update') || action.includes('edit')) return 'bg-yellow-100 text-yellow-600';
    if (action.includes('delete') || action.includes('remove')) return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return '🔐';
    if (action.includes('logout')) return '🚪';
    if (action.includes('create') || action.includes('insert')) return '➕';
    if (action.includes('update') || action.includes('edit')) return '✏️';
    if (action.includes('delete') || action.includes('remove')) return '🗑️';
    return '📝';
  };

  const getNormalizedDescription = (activity: StaffActivity) => {
    if (activity.action === 'user_login') {
      return 'Logged in to the system.';
    }
    if (activity.action === 'user_logout') {
      return 'Logged out of the system.';
    }
    
    // Product-related actions
    if (activity.action === 'create_product') {
      return `Created new product: ${activity.metadata?.name || activity.metadata?.title || 'N/A'}`;
    }
    if (activity.action === 'update_product') {
      return `Updated product: ${activity.metadata?.name || activity.metadata?.title || 'N/A'}`;
    }
    if (activity.action === 'delete_product') {
      return `Deleted product: ${activity.metadata?.name || activity.metadata?.title || 'N/A'}`;
    }
    
    // Category-related actions
    if (activity.action === 'create_category') {
      return `Created new category: ${activity.metadata?.name || 'N/A'}`;
    }
    if (activity.action === 'update_category') {
      return `Updated category: ${activity.metadata?.name || 'N/A'}`;
    }
    if (activity.action === 'delete_category') {
      return `Deleted category: ${activity.metadata?.name || 'N/A'}`;
    }
    
    // Supplier-related actions
    if (activity.action === 'create_supplier') {
      return `Created new supplier: ${activity.metadata?.name || activity.metadata?.company_name || 'N/A'}`;
    }
    if (activity.action === 'update_supplier') {
      return `Updated supplier: ${activity.metadata?.name || activity.metadata?.company_name || 'N/A'}`;
    }
    if (activity.action === 'delete_supplier') {
      return `Deleted supplier: ${activity.metadata?.name || activity.metadata?.company_name || 'N/A'}`;
    }
    
    // POS/Transaction actions
    if (activity.action === 'create_sale') {
      return `Created new sale: ${activity.metadata?.order_number || activity.metadata?.transaction_id || 'N/A'}`;
    }
    if (activity.action === 'update_sale') {
      return `Updated sale: ${activity.metadata?.order_number || activity.metadata?.transaction_id || 'N/A'}`;
    }
    if (activity.action === 'delete_sale') {
      return `Deleted sale: ${activity.metadata?.order_number || activity.metadata?.transaction_id || 'N/A'}`;
    }
    if (activity.action === 'process_payment') {
      return `Processed payment: ${activity.metadata?.order_number || activity.metadata?.transaction_id || 'N/A'}`;
    }
    
    // Order-related actions
    if (activity.action === 'create_order') {
      return `Created new order: ${activity.metadata?.order_number || 'N/A'}`;
    }
    if (activity.action === 'update_order') {
      return `Updated order: ${activity.metadata?.order_number || 'N/A'}`;
    }
    if (activity.action === 'delete_order') {
      return `Deleted order: ${activity.metadata?.order_number || 'N/A'}`;
    }
    if (activity.action === 'fulfill_order') {
      return `Fulfilled order: ${activity.metadata?.order_number || 'N/A'}`;
    }
    
    // Customer-related actions
    if (activity.action === 'create_customer') {
      return `Created new customer: ${activity.metadata?.name || activity.metadata?.email || 'N/A'}`;
    }
    if (activity.action === 'update_customer') {
      return `Updated customer: ${activity.metadata?.name || activity.metadata?.email || 'N/A'}`;
    }
    if (activity.action === 'delete_customer') {
      return `Deleted customer: ${activity.metadata?.name || activity.metadata?.email || 'N/A'}`;
    }
    
    // Inventory actions
    if (activity.action === 'update_inventory') {
      return `Updated inventory: ${activity.metadata?.product_name || 'N/A'}`;
    }
    if (activity.action === 'adjust_stock') {
      return `Adjusted stock: ${activity.metadata?.product_name || 'N/A'}`;
    }
    if (activity.action === 'low_stock_alert') {
      return `Low stock alert: ${activity.metadata?.product_name || 'N/A'}`;
    }
    
    // User/Staff management
    if (activity.action === 'create_user') {
      return `Created new user: ${activity.metadata?.first_name || activity.metadata?.email || 'N/A'}`;
    }
    if (activity.action === 'update_user') {
      return `Updated user: ${activity.metadata?.first_name || activity.metadata?.email || 'N/A'}`;
    }
    if (activity.action === 'delete_user') {
      return `Deleted user: ${activity.metadata?.first_name || activity.metadata?.email || 'N/A'}`;
    }
    
    // Shop settings
    if (activity.action === 'update_shop_settings') {
      return 'Updated shop settings';
    }
    if (activity.action === 'update_shop_profile') {
      return 'Updated shop profile';
    }
    
    // Default fallback for unknown actions
    return `${activity.action} ${activity.table_name ? `on ${activity.table_name}` : ''} ${activity.record_id ? `(ID: ${activity.record_id})` : ''}`.trim();
  };

  const filteredActivities = recentActivities.filter(activity => {
    const matchesSearch = activity.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                          (filterType === 'login' && activity.action?.toLowerCase().includes('login')) ||
                          (filterType === 'products' && activity.table_name === 'products') ||
                          (filterType === 'categories' && (activity.table_name === 'categories' || activity.action?.includes('category'))) ||
                          (filterType === 'suppliers' && (activity.table_name === 'suppliers' || activity.action?.includes('supplier'))) ||
                          (filterType === 'pos' && (activity.action?.includes('sale') || activity.action?.includes('payment') || activity.action?.includes('transaction'))) ||
                          (filterType === 'orders' && activity.table_name === 'orders') ||
                          (filterType === 'customers' && activity.table_name === 'customers') ||
                          (filterType === 'inventory' && (activity.table_name === 'inventory' || activity.action?.includes('inventory') || activity.action?.includes('stock')));

    let matchesDate = true;
    if (dateRange !== 'all') {
      const activityDate = new Date(activity.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - activityDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      matchesDate = (dateRange === '1d' && diffDays <= 1) ||
                   (dateRange === '7d' && diffDays <= 7) ||
                   (dateRange === '30d' && diffDays <= 30);
    }

    return matchesSearch && matchesFilter && matchesDate;
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/shop-owner-auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-600 to-indigo-400 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-600 to-indigo-400">
      {/* Header */}
      <header className="bg-blue-700/20 backdrop-blur-sm border-blue-400/30 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-white">{shop?.name || 'Shop Dashboard'}</h1>
                <p className="text-sm text-blue-100">Staff Activity Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white"
                onClick={() => navigate('/shop-owner-dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Staff Activity & Monitoring</h2>
          <p className="text-blue-100">Monitor staff activity, login sessions, and system notifications</p>
        </div>

        {/* Staff Activity Log */}
        <Card className="mb-8 bg-white/90 backdrop-blur-sm border-blue-300/50">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center text-blue-800">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Staff Activity Log
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Comprehensive tracking of all activities including login sessions, products, categories, suppliers, POS transactions, and staff actions
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                  onClick={exportActivityLog}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                  onClick={() => {
                    fetchRecentActivities();
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                  onClick={async () => {
                    console.log('🧪 Testing database connection...');
                    if (!shop) {
                      console.log('❌ No shop data available');
                      return;
                    }
                    
                    // Test basic query
                    const { data, error } = await supabase
                      .from('staff_activity_logs')
                      .select('count')
                      .eq('shop_id', shop.id);
                    
                    console.log('🧪 Test query result:', { data, error });
                    
                    // Test full query
                    const { data: fullData, error: fullError } = await supabase
                      .from('staff_activity_logs')
                      .select('*')
                      .eq('shop_id', shop.id)
                      .limit(5);
                    
                    console.log('🧪 Full test query result:', { data: fullData, error: fullError });
                  }}
                >
                  🧪 Test DB
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                <Input
                  placeholder="Search by staff name or action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/90 backdrop-blur-sm text-blue-800"
              >
                <option value="all">All Activities</option>
                <option value="login">Login/Logout</option>
                <option value="products">Product Actions</option>
                <option value="categories">Category Actions</option>
                <option value="suppliers">Supplier Actions</option>
                <option value="pos">POS Transactions</option>
                <option value="orders">Order Actions</option>
                <option value="customers">Customer Actions</option>
                <option value="inventory">Inventory Actions</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/90 backdrop-blur-sm text-blue-800"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            {/* Activity List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-100/50">
                    <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-blue-800">
                          {activity.user_name}
                        </p>
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                          {activity.user_role}
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-700">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-blue-500 mt-1">
                        <span>{new Date(activity.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-blue-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                  <p>No activities found</p>
                  <p className="text-xs text-blue-400 mt-1">This section tracks all activities including login sessions, products, categories, suppliers, and business operations</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Login Sessions */}
        <Card className="mb-8 bg-white/90 backdrop-blur-sm border-blue-300/50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Recent Login Sessions
            </CardTitle>
            <CardDescription className="text-blue-600">
              Detailed login/logout history for all staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {loginSessions.length > 0 ? (
                loginSessions.map((session) => (
                  <div key={session.id} className="flex items-center space-x-3 p-3 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-100/50">
                    <div className={`p-2 rounded-full ${getActionColor(session.action)}`}>
                      {getActionIcon(session.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-blue-800">
                          {session.user_name}
                        </p>
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                          {session.user_role}
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-700">
                        {session.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-blue-500 mt-1">
                        <span>{new Date(session.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-blue-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                  <p>Login sessions are now displayed in the Staff Activity Log above</p>
                  <p className="text-xs text-blue-400 mt-1">This provides a unified view of all staff activities</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Recent Notifications
            </CardTitle>
            <CardDescription className="text-blue-600">
              System alerts and important updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="flex items-center space-x-3 p-3 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-100/50">
                    <div className={`p-2 rounded-full ${getActionColor(notification.action)}`}>
                      {getActionIcon(notification.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-blue-800">
                          {notification.user_name}
                        </p>
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                          {notification.user_role}
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-700">
                        {notification.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-blue-500 mt-1">
                        <span>{new Date(notification.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-blue-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                  <p>No notifications available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffActivity;
