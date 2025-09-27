import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Settings, 
  Bell, 
  Activity,
  TrendingUp,
  Clock,
  LogOut,
  User,
  Calendar,
  DollarSign,
  BarChart3,
  Plus,
  Eye,
  Building2,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Star,
  Moon,
  Sun,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { activityTracker, ActivityLog } from '../utils/activityTracker';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalSales: number;
  pendingOrders: number;
  lowStockItems: number;
  todaySales: number;
  weeklyGrowth: number;
}

interface RecentActivity {
  id: string;
  action: string;
  table_name?: string;
  record_id?: string;
  metadata?: any;
  created_at: string;
  user_name?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category_id: string;
  created_at: string;
}

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  customer_name?: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

const ShopStaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalSales: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    todaySales: 0,
    weeklyGrowth: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Module states
  const [showProducts, setShowProducts] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && shop) {
      fetchDashboardData();
      fetchRecentActivities();
      fetchNotifications();
      // Set up real-time subscription for activities
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
        navigate('/staff-auth');
        return;
      }

      setUser(user);

      // Get user profile and shop info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, shops(*)')
        .eq('id', user.id)
        .single();

      if (profile && profile.shops) {
        setShop(profile.shops);
      } else {
        navigate('/staff-auth');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/staff-auth');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!shop) return;

    try {
      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id);

      // Fetch orders count and sales
      const { data: ordersData } = await supabase
        .from('orders')
        .select('status, total_amount, created_at')
        .eq('shop_id', shop.id);

      const totalOrders = ordersData?.length || 0;
      const totalSales = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const pendingOrders = ordersData?.filter(order => order.status === 'pending').length || 0;

      // Calculate today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySales = ordersData?.filter(order => {
        const orderDate = new Date(order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      }).reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Calculate weekly growth (mock data for now)
      const weeklyGrowth = 12.5; // Mock percentage

      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id);

      // Fetch low stock items
      const { data: lowStockData } = await supabase
        .from('inventory')
        .select('quantity, reorder_point')
        .eq('shop_id', shop.id)
        .lt('quantity', 'reorder_point');

      const lowStockItems = lowStockData?.length || 0;

      setStats({
        totalProducts: productsCount || 0,
        totalOrders,
        totalCustomers: customersCount || 0,
        totalSales,
        pendingOrders,
        lowStockItems,
        todaySales,
        weeklyGrowth
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchRecentActivities = async () => {
    if (!shop || !user) return;

    try {
      const activities = await activityTracker.getShopRecentActivities(shop.id, 20);
      setRecentActivities(activities.map(activity => ({
        id: activity.id,
        action: activity.action,
        table_name: activity.table_name,
        record_id: activity.record_id,
        metadata: activity.metadata,
        created_at: activity.created_at,
        user_name: activity.profiles ? 
          `${activity.profiles.first_name} ${activity.profiles.last_name}` : 
          'Unknown User'
      })));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!shop) return;

    try {
      // Fetch notifications from shop_settings or create mock notifications
      const mockNotifications = [
        {
          id: '1',
          title: 'Low Stock Alert',
          message: 'Product "Premium Coffee Beans" is running low on stock',
          type: 'warning',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'New Order Received',
          message: 'Order #1234 has been placed by John Doe',
          type: 'info',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        }
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchProducts = async () => {
    if (!shop) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    if (!shop) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            first_name,
            last_name
          )
        `)
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const ordersWithCustomerNames = (data || []).map(order => ({
        ...order,
        customer_name: order.customers ? 
          `${order.customers.first_name} ${order.customers.last_name}` : 
          'Unknown Customer'
      }));
      
      setOrders(ordersWithCustomerNames);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchCustomers = async () => {
    if (!shop) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleLogout = async () => {
    try {
      if (user && shop) {
        // Track logout activity
        await activityTracker.trackLogout(shop.id, user.id);
      }
      
      await supabase.auth.signOut();
      navigate('/staff-auth');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still sign out even if tracking fails
      await supabase.auth.signOut();
      navigate('/staff-auth');
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_login':
        return <User className="w-4 h-4" />;
      case 'user_logout':
        return <LogOut className="w-4 h-4" />;
      case 'product_created':
      case 'product_updated':
      case 'product_deleted':
        return <Package className="w-4 h-4" />;
      case 'order_created':
      case 'order_updated':
      case 'order_status_changed':
        return <ShoppingCart className="w-4 h-4" />;
      case 'customer_created':
      case 'customer_updated':
      case 'customer_deleted':
        return <Users className="w-4 h-4" />;
      case 'pos_sale':
      case 'pos_return':
      case 'pos_refund':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'bg-green-100 text-green-800';
    if (action.includes('updated')) return 'bg-blue-100 text-blue-800';
    if (action.includes('deleted')) return 'bg-red-100 text-red-800';
    if (action.includes('login')) return 'bg-purple-100 text-purple-800';
    if (action.includes('logout')) return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Professional Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">{shop?.name || 'Shop Dashboard'}</h1>
                <p className="text-blue-200 text-sm font-medium">Staff Management Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <p className="text-xs text-blue-200 uppercase tracking-wide">Welcome,</p>
                <p className="text-sm font-semibold text-white">
                  {user?.email?.split('@')[0] || 'Staff Member'}
                </p>
                <p className="text-xs text-blue-200 capitalize">Staff</p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-200 hover:text-blue-100 hover:bg-white/20 px-3 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-blue-300"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-200 hover:text-blue-100 hover:bg-white/20 px-3 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-blue-300"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              <Button
                variant="ghost"
                className="text-white hover:text-blue-200 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-blue-300"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Products Card */}
          <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium mb-1">Total Products</p>
                  <p className="text-3xl font-bold text-white">{stats.totalProducts}</p>
                  <div className="flex items-center mt-2">
                    <Package className="h-4 w-4 text-blue-300 mr-1" />
                    <span className="text-xs text-blue-300">{stats.lowStockItems} low stock</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                  <Package className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Orders Card */}
          <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-white">{stats.totalOrders}</p>
                  <div className="flex items-center mt-2">
                    <Clock className="h-4 w-4 text-yellow-300 mr-1" />
                    <span className="text-xs text-yellow-300">{stats.pendingOrders} pending</span>
                  </div>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                  <ShoppingCart className="h-8 w-8 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Customers Card */}
          <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium mb-1">Total Customers</p>
                  <p className="text-3xl font-bold text-white">{stats.totalCustomers}</p>
                  <div className="flex items-center mt-2">
                    <Users className="h-4 w-4 text-purple-300 mr-1" />
                    <span className="text-xs text-purple-300">Active customers</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                  <Users className="h-8 w-8 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Card */}
          <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-white">N${stats.totalSales.toFixed(2)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-300 mr-1" />
                    <span className="text-xs text-green-300">+{stats.weeklyGrowth}% this week</span>
                  </div>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <Card className="mb-8 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white font-bold text-xl flex items-center">
              <Zap className="h-6 w-6 mr-3 text-yellow-400" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-blue-200">
              Access frequently used features and tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border-blue-400/50 text-white hover:from-blue-500/30 hover:to-blue-600/30 hover:border-blue-300 hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                onClick={() => {
                  setShowProducts(true);
                  setShowOrders(false);
                  setShowCustomers(false);
                  setShowPOS(false);
                  fetchProducts();
                }}
              >
                <Package className="h-8 w-8 mb-3 text-blue-300 group-hover:text-blue-200 transition-colors" />
                <span className="font-semibold">Manage Products</span>
                <span className="text-xs text-blue-200 opacity-80">Inventory & Pricing</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-24 flex-col bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border-green-400/50 text-white hover:from-green-500/30 hover:to-green-600/30 hover:border-green-300 hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                onClick={() => {
                  setShowOrders(true);
                  setShowProducts(false);
                  setShowCustomers(false);
                  setShowPOS(false);
                  fetchOrders();
                }}
              >
                <ShoppingCart className="h-8 w-8 mb-3 text-green-300 group-hover:text-green-200 transition-colors" />
                <span className="font-semibold">View Orders</span>
                <span className="text-xs text-green-200 opacity-80">Track & Manage</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-24 flex-col bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border-purple-400/50 text-white hover:from-purple-500/30 hover:to-purple-600/30 hover:border-purple-300 hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                onClick={() => {
                  setShowCustomers(true);
                  setShowProducts(false);
                  setShowOrders(false);
                  setShowPOS(false);
                  fetchCustomers();
                }}
              >
                <Users className="h-8 w-8 mb-3 text-purple-300 group-hover:text-purple-200 transition-colors" />
                <span className="font-semibold">Manage Customers</span>
                <span className="text-xs text-purple-200 opacity-80">Database & Profiles</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-24 flex-col bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm border-orange-400/50 text-white hover:from-orange-500/30 hover:to-orange-600/30 hover:border-orange-300 hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                onClick={() => {
                  setShowPOS(true);
                  setShowProducts(false);
                  setShowOrders(false);
                  setShowCustomers(false);
                }}
              >
                <CreditCard className="h-8 w-8 mb-3 text-orange-300 group-hover:text-orange-200 transition-colors" />
                <span className="font-semibold">POS System</span>
                <span className="text-xs text-orange-200 opacity-80">Sales & Transactions</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Panel */}
        <Card className="mb-8 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-white font-bold text-xl">
              <Bell className="h-6 w-6 mr-3 text-yellow-400" />
              Notifications & Alerts
            </CardTitle>
            <CardDescription className="text-blue-200">
              Important updates and alerts for your shop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
                    <div className={`p-3 rounded-full ${
                      notification.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                      notification.type === 'info' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{notification.title}</p>
                      <p className="text-blue-200 text-sm">{notification.message}</p>
                      <p className="text-xs text-blue-300 mt-2">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-blue-200 hover:text-white hover:bg-white/20">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-blue-200">
                  <Bell className="h-16 w-16 mx-auto mb-4 text-blue-300 opacity-50" />
                  <p className="text-lg font-medium">No new notifications</p>
                  <p className="text-sm opacity-80">You're all caught up!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products Module */}
        {showProducts && (
          <Card className="mb-8 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center text-white font-bold text-xl">
                  <Package className="h-6 w-6 mr-3 text-blue-400" />
                  Products Management
                </CardTitle>
                <Button onClick={() => setShowProducts(false)} variant="ghost" className="text-blue-200 hover:text-white hover:bg-white/20">
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              <CardDescription className="text-blue-200">
                Manage your shop's product inventory and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-blue-300 focus:border-blue-400 focus:bg-white/20"
                  />
                </div>
              </div>
              <div className="space-y-3">
                {products
                  .filter(product => 
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.description.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
                      <div className="flex-1">
                        <p className="font-semibold text-white">{product.name}</p>
                        <p className="text-sm text-blue-200">{product.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-blue-300">Stock: {product.stock_quantity}</span>
                          <span className="text-xs text-green-300">SKU: {product.id.slice(0, 8)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-white text-lg">N${product.price}</span>
                        <Button variant="outline" size="sm" className="border-blue-400/50 text-blue-200 hover:bg-blue-500/20 hover:border-blue-300">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="border-green-400/50 text-green-200 hover:bg-green-500/20 hover:border-green-300">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders Module */}
        {showOrders && (
          <Card className="mb-8 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center text-white font-bold text-xl">
                  <ShoppingCart className="h-6 w-6 mr-3 text-green-400" />
                  Orders Management
                </CardTitle>
                <Button onClick={() => setShowOrders(false)} variant="ghost" className="text-green-200 hover:text-white hover:bg-white/20">
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              <CardDescription className="text-blue-200">
                View and manage customer orders and statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-white">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-blue-200">{order.customer_name}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-blue-300">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-green-300">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-white text-lg">N${order.total_amount}</span>
                      <Badge className={`${getStatusColor(order.status)} border-0`}>
                        {order.status}
                      </Badge>
                      <Button variant="outline" size="sm" className="border-green-400/50 text-green-200 hover:bg-green-500/20 hover:border-green-300">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customers Module */}
        {showCustomers && (
          <Card className="mb-8 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center text-white font-bold text-xl">
                  <Users className="h-6 w-6 mr-3 text-purple-400" />
                  Customer Management
                </CardTitle>
                <Button onClick={() => setShowCustomers(false)} variant="ghost" className="text-purple-200 hover:text-white hover:bg-white/20">
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              <CardDescription className="text-blue-200">
                Manage your customer database and profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{customer.first_name} {customer.last_name}</p>
                      <div className="flex items-center space-x-4 text-sm text-blue-200 mt-2">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-blue-300" />
                          <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-blue-300" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-blue-300 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{customer.address}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="border-purple-400/50 text-purple-200 hover:bg-purple-500/20 hover:border-purple-300">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="border-green-400/50 text-green-200 hover:bg-green-500/20 hover:border-green-300">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* POS System Module */}
        {showPOS && (
          <Card className="mb-8 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center text-white font-bold text-xl">
                  <CreditCard className="h-6 w-6 mr-3 text-orange-400" />
                  Point of Sale System
                </CardTitle>
                <Button onClick={() => setShowPOS(false)} variant="ghost" className="text-orange-200 hover:text-white hover:bg-white/20">
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              <CardDescription className="text-blue-200">
                Process sales and manage transactions efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <CreditCard className="h-20 w-20 text-orange-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">Full POS System</h3>
                <p className="text-blue-200 mb-6 max-w-md mx-auto">
                  Access the complete point of sale system with product images, cart management, 
                  customer selection, and real-time inventory updates.
                </p>
                <Button 
                  onClick={() => window.open(`/shop/${shop?.id}/staff-pos`, '_blank')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Open Full POS System
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activities */}
        <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-white font-bold text-xl">
              <Activity className="h-6 w-6 mr-3 text-blue-400" />
              Recent Activities
            </CardTitle>
            <CardDescription className="text-blue-200">
              Latest actions performed by staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
                    <div className={`p-3 rounded-full ${getActionColor(activity.action)}`}>
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">
                        {activity.user_name} {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      {activity.metadata && (
                        <p className="text-sm text-blue-200 mt-1">
                          {Object.entries(activity.metadata)
                            .filter(([key]) => key !== 'session_id')
                            .map(([key, value]) => {
                              if (key === 'login_time') {
                                const date = new Date(value as string);
                                return `Login: ${date.toLocaleDateString()} at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
                              }
                              return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`;
                            })
                            .join(' • ')}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="border-blue-400/50 text-blue-200 bg-blue-500/10">
                      {formatTimeAgo(activity.created_at)}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-blue-200">
                  <Activity className="h-16 w-16 mx-auto mb-4 text-blue-300 opacity-50" />
                  <p className="text-lg font-medium">No recent activities</p>
                  <p className="text-sm opacity-80">Activities will appear here as you work</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShopStaffDashboard;
