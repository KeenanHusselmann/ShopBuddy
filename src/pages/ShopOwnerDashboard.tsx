import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

import { 
  Users, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp,
  Building2,
  ShoppingBag,
  TrendingDown,
  Activity,
  Bell,
  Clock,
  AlertCircle,
  Eye,
  BarChart3,
  LogOut
} from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalSales: number;
  pendingOrders: number;
  lowStockItems: number;
  totalStaff: number;
  activeStaff: number;
}



const ShopOwnerDashboard: React.FC = () => {
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
    totalStaff: 0,
    activeStaff: 0
  });
  const [salesData, setSalesData] = useState<any>(null);
  const [salesLoading, setSalesLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [currentNotificationPage, setCurrentNotificationPage] = useState(1);
  const [notificationsPerPage] = useState(5);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && shop) {
      fetchDashboardData();
      fetchSalesData(); // Fetch sales data on mount
      fetchNotifications(); // Fetch notifications
      checkExistingLowStockItems(); // Check for existing low stock items
    }
  }, [user, shop]);

  // Real-time subscriptions for live updates
  useEffect(() => {
    if (!shop) return;

    // Subscribe to activity_logs changes
    const activityLogsSubscription = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs',
          filter: `shop_id=eq.${shop.id}`
        },
        (payload) => {
          console.log('Activity log change detected:', payload);
          // Refresh notifications when new activity logs are added
          fetchNotifications();
          // Refresh dashboard data to update low stock count
          fetchDashboardData();
        }
      )
      .subscribe();

    // Subscribe to inventory changes for real-time low stock updates
    const inventorySubscription = supabase
      .channel('inventory_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `shop_id=eq.${shop.id}`
        },
        (payload) => {
          console.log('Inventory change detected:', payload);
          // Refresh dashboard data to update low stock count
          fetchDashboardData();
        }
      )
      .subscribe();

    // Subscribe to products changes
    const productsSubscription = supabase
      .channel('products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `shop_id=eq.${shop.id}`
        },
        (payload) => {
          console.log('Product change detected:', payload);
          // Refresh dashboard data when products are added/updated/deleted
          fetchDashboardData();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      activityLogsSubscription.unsubscribe();
      inventorySubscription.unsubscribe();
      productsSubscription.unsubscribe();
    };
  }, [shop]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/shop-owner-auth');
        return;
      }

      setUser(user);

      // Get user profile and shop info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, shops(*)')
        .eq('id', user.id)
        .single();

      if (profile && profile.shops && profile.role === 'shop_admin') {
        setShop(profile.shops);
      } else {
        navigate('/shop-owner-auth');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/shop-owner-auth');
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
        .select('status, total_amount')
        .eq('shop_id', shop.id);

      const totalOrders = ordersData?.length || 0;
      const totalSales = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const pendingOrders = ordersData?.filter(order => order.status === 'pending').length || 0;

      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id);

      // Fetch low stock items
      const { data: lowStockData } = await supabase
        .from('inventory')
        .select('quantity, reorder_point')
        .eq('shop_id', shop.id);

      // Filter low stock items in JavaScript since we can't compare columns in Supabase
      const lowStockItems = lowStockData?.filter(item => 
        item.quantity <= item.reorder_point && item.reorder_point > 0
      ).length || 0;

      // Fetch staff count
      const { count: staffCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id)
        .eq('role', 'staff');

      // Get active staff count from login sessions
      const activeStaff = activeSessions.length;

      setStats({
        totalProducts: productsCount || 0,
        totalOrders,
        totalCustomers: customersCount || 0,
        totalSales,
        pendingOrders,
        lowStockItems,
        totalStaff: staffCount || 0,
        activeStaff
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };













  const fetchNotifications = async () => {
    if (!shop) return;

    try {
      console.log('Fetching notifications for shop:', shop.id);
      
      // Fetch notifications from activity_logs table
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('shop_id', shop.id)
        .in('action', ['product_created', 'product_updated', 'product_deleted', 'low_stock_alert', 'stock_adjusted'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (notificationsError) {
        console.error('Error fetching notifications:', notificationsError);
        return;
      }

      console.log('Raw notifications data:', notificationsData);

      if (notificationsData) {
        // Transform activity logs into notifications
        const transformedNotifications = notificationsData.map(log => ({
          id: log.id,
          title: getNotificationTitle(log.action, log.details),
          message: getNotificationMessage(log.action, log.details),
          type: getNotificationType(log.action),
          created_at: log.created_at
        }));
        
        console.log('Transformed notifications:', transformedNotifications);
        setNotifications(transformedNotifications);
        // Reset to first page when new notifications are fetched
        setCurrentNotificationPage(1);
      } else {
        console.log('No notifications data received');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getNotificationTitle = (action: string, details: any) => {
    switch (action) {
      case 'product_created':
        return 'New Product Added';
      case 'product_updated':
        return 'Product Updated';
      case 'product_deleted':
        return 'Product Deleted';
      case 'low_stock_alert':
        return 'Low Stock Alert';
      case 'stock_adjusted':
        return 'Stock Adjusted';
      default:
        return 'Activity Update';
    }
  };

  const getNotificationMessage = (action: string, details: any) => {
    try {
      const parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
      
      switch (action) {
        case 'product_created':
          return `Product "${parsedDetails?.product_name || 'Unknown'}" has been added to inventory`;
        case 'product_updated':
          return `Product "${parsedDetails?.product_name || 'Unknown'}" has been updated`;
        case 'product_deleted':
          return `Product "${parsedDetails?.product_name || 'Unknown'}" has been removed from inventory`;
        case 'low_stock_alert':
          return `Product "${parsedDetails?.product_name || 'Unknown'}" is running low on stock (${parsedDetails?.current_stock || 0} remaining)`;
        case 'stock_adjusted':
          return `Stock for "${parsedDetails?.product_name || 'Unknown'}" has been adjusted to ${parsedDetails?.new_stock || 0}`;
        default:
          return 'An activity has occurred in your shop';
      }
    } catch (error) {
      return 'An activity has occurred in your shop';
    }
  };

  const getNotificationType = (action: string) => {
    switch (action) {
      case 'low_stock_alert':
        return 'warning';
      case 'product_deleted':
        return 'destructive';
      case 'product_created':
      case 'product_updated':
      case 'stock_adjusted':
        return 'info';
      default:
        return 'info';
    }
  };

  const handleViewNotification = (notification: any) => {
    setSelectedNotification(notification);
    setShowNotificationModal(true);
  };

  const closeNotificationModal = () => {
    setShowNotificationModal(false);
    setSelectedNotification(null);
  };

  // Pagination functions for notifications
  const getCurrentNotifications = () => {
    const startIndex = (currentNotificationPage - 1) * notificationsPerPage;
    const endIndex = startIndex + notificationsPerPage;
    return notifications.slice(startIndex, endIndex);
  };

  const getTotalNotificationPages = () => {
    return Math.ceil(notifications.length / notificationsPerPage);
  };

  const handleNotificationPageChange = (page: number) => {
    setCurrentNotificationPage(page);
    // Scroll to top of notifications section
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Ensure current page is valid when notifications change
  useEffect(() => {
    const totalPages = getTotalNotificationPages();
    if (currentNotificationPage > totalPages && totalPages > 0) {
      setCurrentNotificationPage(totalPages);
    }
  }, [notifications, currentNotificationPage]);

  const fetchSalesData = async () => {
    if (!shop) return;

    try {
      setSalesLoading(true);
      
      // Get current month and previous months
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const monthlyData = [];
      
      // Fetch data for last 6 months
      for (let i = 5; i >= 0; i--) {
        const month = currentMonth - i;
        const year = currentYear;
        const adjustedMonth = month < 0 ? month + 12 : month;
        const adjustedYear = month < 0 ? year - 1 : year;
        
        const startDate = new Date(adjustedYear, adjustedMonth, 1);
        const endDate = new Date(adjustedYear, adjustedMonth + 1, 0);
        
        // Fetch orders for this month
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, total_amount, status, created_at')
          .eq('shop_id', shop.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .not('status', 'eq', 'cancelled');
        
        // Fetch order items for revenue calculation
        let monthlyRevenue = 0;
        let monthlyOrders = 0;
        let monthlyItems = 0;
        
        if (ordersData && ordersData.length > 0) {
          monthlyOrders = ordersData.length;
          
          for (const order of ordersData) {
            monthlyRevenue += order.total_amount || 0;
            
            // Get order items count
            const { data: orderItems } = await supabase
              .from('order_items')
              .select('quantity')
              .eq('order_id', order.id);
            
            if (orderItems) {
              orderItems.forEach(item => {
                monthlyItems += item.quantity || 0;
              });
            }
          }
        }
        
        monthlyData.push({
          month: startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue: monthlyRevenue,
          orders: monthlyOrders,
          items: monthlyItems,
          date: startDate
        });
      }
      
      // Calculate performance metrics
      const currentMonthData = monthlyData[monthlyData.length - 1];
      const previousMonthData = monthlyData[monthlyData.length - 2];
      
      const revenueChange = previousMonthData ? 
        ((currentMonthData.revenue - previousMonthData.revenue) / previousMonthData.revenue * 100) : 0;
      
      const ordersChange = previousMonthData ? 
        ((currentMonthData.orders - previousMonthData.orders) / previousMonthData.orders * 100) : 0;
      
      setSalesData({
        monthlyData,
        currentMonth: currentMonthData,
        previousMonth: previousMonthData,
        revenueChange,
        ordersChange,
        totalRevenue: monthlyData.reduce((sum, month) => sum + month.revenue, 0),
        totalOrders: monthlyData.reduce((sum, month) => sum + month.orders, 0),
        totalItems: monthlyData.reduce((sum, month) => sum + month.items, 0)
      });
      
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setSalesLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/shop-owner-auth');
    } catch (error) {
      console.error('Error during logout:', error);
      await supabase.auth.signOut();
      navigate('/shop-owner-auth');
    }
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

  const checkExistingLowStockItems = async () => {
    if (!shop) return;

    try {
      console.log('Checking existing low stock items for shop:', shop.id);
      
      // Get all inventory items for this shop
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          quantity, 
          reorder_point,
          product_id
        `)
        .eq('shop_id', shop.id);

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
        return;
      }

      console.log('Inventory data:', inventoryData);

      if (inventoryData && inventoryData.length > 0) {
        // Filter low stock items
        const lowStockItems = inventoryData.filter(item => 
          item.quantity <= item.reorder_point && item.reorder_point > 0
        );

        console.log('Low stock items found:', lowStockItems);

        // Create low stock notifications for existing items
        for (const item of lowStockItems) {
          if (item.product_id) {
            // Get product name for the notification
            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('name, sku')
              .eq('id', item.product_id)
              .single();

            if (productError) {
              console.error('Error fetching product:', productError);
              continue;
            }

            if (productData) {
              console.log('Creating low stock notification for product:', productData.name);
              
              // Create the notification directly without checking for duplicates first
              const { data: notificationResult, error: notificationError } = await supabase
                .from('activity_logs')
                .insert({
                  shop_id: shop.id,
                  action: 'low_stock_alert',
                  details: JSON.stringify({
                    product_id: item.product_id,
                    product_name: productData.name,
                    current_stock: item.quantity,
                    reorder_point: item.reorder_point
                  }),
                  table_name: 'inventory',
                  created_at: new Date().toISOString()
                })
                .select()
                .single();

              if (notificationError) {
                console.error('Error creating notification:', notificationError);
              } else {
                console.log('Notification created successfully:', notificationResult);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking existing low stock items:', error);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 via-blue-600 to-indigo-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-lg text-white">Loading dashboard...</p>
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
                <p className="text-sm text-blue-100">Owner Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-blue-800/20 backdrop-blur-sm border-r border-blue-400/30 min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              <div className="px-3 py-2">
                <h3 className="text-sm font-semibold text-blue-200 uppercase tracking-wider">Navigation</h3>
              </div>
              
              <a
                href="/staff-management"
                className="flex items-center px-3 py-2 text-blue-100 hover:bg-blue-700/30 rounded-md transition-colors"
              >
                <Users className="h-4 w-4 mr-3" />
                Manage Staff
              </a>
              
              <a
                href="/staff-activity"
                className="flex items-center px-3 py-2 text-blue-100 hover:bg-blue-700/30 rounded-md transition-colors"
              >
                <Activity className="h-4 w-4 mr-3" />
                Staff Activity
              </a>
              
              <a
                href="/customer-management"
                className="flex items-center px-3 py-2 text-blue-100 hover:bg-blue-700/30 rounded-md transition-colors"
              >
                <ShoppingBag className="h-4 w-4 mr-3" />
                Manage Customers
              </a>
              
              <a
                href={`/shop/${shop.id}/shop-owner-pos`}
                className="flex items-center px-3 py-2 text-blue-100 hover:bg-blue-700/30 rounded-md transition-colors"
              >
                <CreditCard className="h-4 w-4 mr-3" />
                POS System
              </a>
              
              <a
                href="/shop-owner-analytics"
                className="flex items-center px-3 py-2 text-blue-100 hover:bg-blue-700/30 rounded-md transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-3" />
                Analytics
              </a>
              
              <a
                href="/shop-owner-products"
                className="flex items-center px-3 py-2 text-blue-100 hover:bg-blue-700/30 rounded-md transition-colors"
              >
                <Package className="h-4 w-4 mr-3" />
                Products
              </a>
              
              <a
                href={`/shop/${shop.id}/shop-owner-orders`}
                className="flex items-center px-3 py-2 text-blue-100 hover:bg-blue-700/30 rounded-md transition-colors"
              >
                <ShoppingCart className="h-4 w-4 mr-3" />
                Orders
              </a>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Products</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.totalProducts}</div>
              <p className="text-xs text-blue-600">
                {stats.lowStockItems} low stock items
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.totalOrders}</div>
              <p className="text-xs text-blue-600">
                {stats.pendingOrders} pending
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.totalCustomers}</div>
              <p className="text-xs text-blue-600">
                Active customers
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Staff Activity</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.activeStaff}</div>
              <p className="text-xs text-blue-600">
                {stats.totalStaff} total staff
              </p>
            </CardContent>
          </Card>
        </div>

                 {/* Notifications Panel */}
         <Card className="mb-8 bg-white/90 backdrop-blur-sm border-blue-300/50">
           <CardHeader>
             <CardTitle className="flex items-center text-blue-800">
               <Bell className="h-5 w-5 mr-2 text-blue-600" />
               Shop Notifications
             </CardTitle>
             <CardDescription className="text-blue-600">
               Important updates and alerts for your shop
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-3">
               {notifications.length > 0 ? (
                 <>
                   {getCurrentNotifications().map((notification) => (
                     <div key={notification.id} className="flex items-start space-x-3 p-3 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-100/50">
                       <div className={`p-2 rounded-full ${
                         notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                         notification.type === 'info' ? 'bg-blue-100 text-blue-800' :
                         'bg-blue-100 text-blue-800'
                       }`}>
                         <AlertCircle className="h-4 w-4" />
                       </div>
                       <div className="flex-1">
                         <p className="font-medium text-blue-800">{notification.title}</p>
                         <p className="text-sm text-blue-700">{notification.message}</p>
                         <p className="text-xs text-blue-600 mt-1">
                           {formatTimeAgo(notification.created_at)}
                         </p>
                       </div>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="text-blue-600 hover:text-blue-800 hover:bg-blue-100/50"
                         onClick={() => handleViewNotification(notification)}
                         title="View notification details"
                       >
                         <Eye className="h-4 w-4" />
                       </Button>
                     </div>
                   ))}
                   
                   {/* Pagination Controls */}
                   {getTotalNotificationPages() > 1 && (
                     <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                       <div className="text-sm text-blue-600">
                         Showing {((currentNotificationPage - 1) * notificationsPerPage) + 1} to {Math.min(currentNotificationPage * notificationsPerPage, notifications.length)} of {notifications.length} notifications
                       </div>
                       <div className="flex items-center space-x-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleNotificationPageChange(currentNotificationPage - 1)}
                           disabled={currentNotificationPage === 1}
                           className="text-blue-600 border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           Previous
                         </Button>
                         
                         <div className="flex items-center space-x-1">
                           {Array.from({ length: getTotalNotificationPages() }, (_, i) => i + 1).map((page) => (
                             <Button
                               key={page}
                               variant={currentNotificationPage === page ? "default" : "outline"}
                               size="sm"
                               onClick={() => handleNotificationPageChange(page)}
                               className={`w-8 h-8 p-0 ${
                                 currentNotificationPage === page 
                                   ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                   : 'text-blue-600 border-blue-300 hover:bg-blue-50'
                               }`}
                             >
                               {page}
                             </Button>
                           ))}
                         </div>
                         
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleNotificationPageChange(currentNotificationPage + 1)}
                           disabled={currentNotificationPage === getTotalNotificationPages()}
                           className="text-blue-600 border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           Next
                         </Button>
                       </div>
                     </div>
                   )}
                 </>
               ) : (
                 <div className="text-center py-8 text-blue-500">
                   <Bell className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                   <p>No new notifications</p>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>

                 {/* Active Sessions */}
         {activeSessions.length > 0 && (
           <Card className="mb-8 bg-white/90 backdrop-blur-sm border-blue-300/50">
             <CardHeader>
               <CardTitle className="flex items-center text-blue-800">
                 <Clock className="h-5 w-5 mr-2 text-blue-600" />
                 Active Staff Sessions ({activeSessions.length})
               </CardTitle>
               <CardDescription className="text-blue-600">
                 Staff members currently logged into the system
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-3">
                 {activeSessions.map((session) => (
                   <div key={session.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                     <div className="flex items-center space-x-3">
                       <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                       <div>
                         <p className="font-medium text-blue-800">
                           {session.profiles?.first_name} {session.profiles?.last_name}
                         </p>
                         <p className="text-sm text-blue-600">
                           Logged in at {new Date(session.login_time).toLocaleTimeString()}
                         </p>
                       </div>
                     </div>
                     <div className="text-right">
                       <Badge variant="secondary" className="mb-1">
                         {formatTimeAgo(session.login_time)}
                       </Badge>
                       <p className="text-xs text-blue-600">
                         IP: {session.ip_address || 'N/A'}
                       </p>
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         )}







          {/* Monthly Sales Chart */}
          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Monthly Sales Performance
              </CardTitle>
              <CardDescription className="text-blue-600">
                Track your sales performance over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : salesData ? (
                <div className="space-y-6">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-800">
                        ${salesData.totalRevenue.toLocaleString()}
                      </div>
                      <p className="text-sm text-blue-600">Total Revenue</p>
                      <div className="flex items-center justify-center mt-2">
                        {salesData.revenueChange >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${
                          salesData.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(salesData.revenueChange).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-800">
                        {salesData.totalOrders}
                      </div>
                      <p className="text-sm text-green-600">Total Orders</p>
                      <div className="flex items-center justify-center mt-2">
                        {salesData.ordersChange >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${
                          salesData.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(salesData.ordersChange).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-800">
                        {salesData.totalItems}
                      </div>
                      <p className="text-sm text-purple-600">Items Sold</p>
                    </div>
                  </div>

                  {/* Monthly Chart */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-blue-800">Monthly Revenue Trend</h4>
                    <div className="h-64 flex items-end justify-between space-x-2">
                      {salesData.monthlyData.map((month, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full bg-blue-200 rounded-t-sm relative group">
                            <div 
                              className="bg-blue-600 rounded-t-sm transition-all duration-300 group-hover:bg-blue-700"
                              style={{ 
                                height: `${Math.max((month.revenue / Math.max(...salesData.monthlyData.map(m => m.revenue))) * 200, 20)}px`
                              }}
                            ></div>
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              ${month.revenue.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-xs text-blue-600 mt-2 text-center">
                            {month.month}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Monthly Data Table */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-blue-800">Monthly Breakdown</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-blue-200">
                            <th className="text-left py-2 text-blue-700">Month</th>
                            <th className="text-right py-2 text-blue-700">Revenue</th>
                            <th className="text-right py-2 text-blue-700">Orders</th>
                            <th className="text-right py-2 text-blue-700">Items</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesData.monthlyData.map((month, index) => (
                            <tr key={index} className="border-b border-blue-100">
                              <td className="py-2 text-blue-800 font-medium">{month.month}</td>
                              <td className="py-2 text-right text-blue-800">${month.revenue.toLocaleString()}</td>
                              <td className="py-2 text-right text-blue-600">{month.orders}</td>
                              <td className="py-2 text-right text-blue-600">{month.items}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-blue-600 text-center py-8">No sales data available</p>
              )}
            </CardContent>
          </Card>
          </div>
        </main>
      </div>

      {/* Notification Detail Modal */}
      {showNotificationModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Notification Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeNotificationModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Notification Icon and Type */}
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-full ${
                  selectedNotification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  selectedNotification.type === 'destructive' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{selectedNotification.title}</h4>
                  <p className={`text-sm ${
                    selectedNotification.type === 'warning' ? 'text-yellow-700' :
                    selectedNotification.type === 'destructive' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>
                    {selectedNotification.type === 'warning' ? 'Warning' :
                     selectedNotification.type === 'destructive' ? 'Alert' :
                     'Information'}
                  </p>
                </div>
              </div>

              {/* Notification Message */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800">{selectedNotification.message}</p>
              </div>

              {/* Timestamp */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Created: {new Date(selectedNotification.created_at).toLocaleString()}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={closeNotificationModal}
                  className="flex-1"
                >
                  Close
                </Button>
                {selectedNotification.type === 'warning' && (
                  <Button
                    onClick={() => {
                      // Navigate to products page to address low stock
                      window.location.href = '/shop-owner-products';
                      closeNotificationModal();
                    }}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    View Products
                  </Button>
                )}
                {selectedNotification.type === 'info' && (
                  <Button
                    onClick={() => {
                      // Navigate to products page for general product info
                      window.location.href = '/shop-owner-products';
                      closeNotificationModal();
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    View Products
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopOwnerDashboard;
