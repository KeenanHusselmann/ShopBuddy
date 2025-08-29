import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  Download,
  RefreshCw,
  LogOut,
  ArrowLeft,
  Building2,
  Eye,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
  salesGrowth: number;
  ordersGrowth: number;
  customerGrowth: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  salesByMonth: Array<{
    month: string;
    sales: number;
    orders: number;
  }>;
  customerTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  recentOrders: Array<{
    id: string;
    customer_name: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
}

const ShopOwnerAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [shop, setShop] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/shop-owner-auth');
        return;
      }

      // Get user profile with shop details
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, shops(*)')
        .eq('id', user.id)
        .single();

      if (profile?.shops) {
        setShop(profile.shops);
        await fetchAnalytics(profile.shops.id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load analytics data'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (shopId: string) => {
    try {
      const now = new Date();
      const startDate = new Date();
      
      // Calculate start date based on selected range
      switch (dateRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Fetch orders data
      const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(*), customers(*)')
        .eq('shop_id', shopId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
        .order('created_at', { ascending: false });

      // Fetch products data
      const { data: products } = await supabase
        .from('products')
        .select('*, inventory(*)')
        .eq('shop_id', shopId);

      // Fetch customers data
      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId);

      // Calculate analytics
      const analytics = calculateAnalytics(orders || [], products || [], customers || [], startDate, now);
      setAnalyticsData(analytics);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load analytics data'
      });
    }
  };

  const calculateAnalytics = (
    orders: any[], 
    products: any[], 
    customers: any[], 
    startDate: Date, 
    endDate: Date
  ): AnalyticsData => {
    const totalSales = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = customers.length;
    const totalProducts = products.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Calculate growth (mock data for now)
    const salesGrowth = 12.5; // Mock percentage
    const ordersGrowth = 8.3;
    const customerGrowth = 15.7;

    // Top products by revenue
    const productRevenue: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          if (!productRevenue[product.id]) {
            productRevenue[product.id] = {
              name: product.name,
              quantity: 0,
              revenue: 0
            };
          }
          productRevenue[product.id].quantity += item.quantity;
          productRevenue[product.id].revenue += item.total_price;
        }
      });
    });

    const topProducts = Object.values(productRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Sales by month
    const salesByMonth = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const monthKey = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === currentDate.getMonth() && 
               orderDate.getFullYear() === currentDate.getFullYear();
      });
      
      const monthSales = monthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      
      salesByMonth.push({
        month: monthKey,
        sales: monthSales,
        orders: monthOrders.length
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Customer types distribution
    const customerTypeCount: { [key: string]: number } = {};
    customers.forEach(customer => {
      customerTypeCount[customer.customer_type] = (customerTypeCount[customer.customer_type] || 0) + 1;
    });

    const customerTypes = Object.entries(customerTypeCount).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      percentage: (count / totalCustomers) * 100
    }));

    // Recent orders
    const recentOrders = orders.slice(0, 10).map(order => ({
      id: order.id,
      customer_name: order.customers ? 
        `${order.customers.first_name} ${order.customers.last_name}` : 'Unknown Customer',
      total_amount: order.total_amount,
      status: order.status,
      created_at: order.created_at
    }));

    return {
      totalSales,
      totalOrders,
      totalCustomers,
      totalProducts,
      averageOrderValue,
      salesGrowth,
      ordersGrowth,
      customerGrowth,
      topProducts,
      salesByMonth,
      customerTypes,
      recentOrders
    };
  };

  const exportAnalytics = () => {
    if (!analyticsData) return;

    const csvContent = [
      ['Metric', 'Value'],
              ['Total Sales', `N${analyticsData.totalSales.toFixed(2)}`],
      ['Total Orders', analyticsData.totalOrders],
      ['Total Customers', analyticsData.totalCustomers],
      ['Total Products', analyticsData.totalProducts],
              ['Average Order Value', `N${analyticsData.averageOrderValue.toFixed(2)}`],
      ['Sales Growth', `${analyticsData.salesGrowth}%`],
      ['Orders Growth', `${analyticsData.ordersGrowth}%`],
      ['Customer Growth', `${analyticsData.customerGrowth}%`],
      [''],
      ['Top Products', 'Quantity', 'Revenue'],
      ...analyticsData.topProducts.map(product => [
        product.name,
        product.quantity,
                  `N${product.revenue.toFixed(2)}`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shop_analytics_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Analytics Exported! 📊',
      description: 'Analytics data has been downloaded as CSV'
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/shop-owner-auth');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/shop-owner-auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 via-blue-600 to-indigo-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-lg text-white">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg">No analytics data available</p>
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
                <h1 className="text-2xl font-bold text-white">Shop Analytics</h1>
                <p className="text-sm text-blue-100">Business Insights & Performance</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-white/20 backdrop-blur-sm border-white/30 text-white w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white"
                onClick={exportAnalytics}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white"
                onClick={() => fetchData()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                N${analyticsData.totalSales.toFixed(2)}
              </div>
              <div className="flex items-center text-xs text-blue-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{analyticsData.salesGrowth}% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{analyticsData.totalOrders}</div>
              <div className="flex items-center text-xs text-blue-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{analyticsData.ordersGrowth}% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{analyticsData.totalCustomers}</div>
              <div className="flex items-center text-xs text-blue-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{analyticsData.customerGrowth}% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Avg Order Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                N${analyticsData.averageOrderValue.toFixed(2)}
              </div>
              <p className="text-xs text-blue-600">
                Per transaction
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Products */}
          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50">
            <CardHeader>
              <CardTitle className="text-blue-800">Top Products by Revenue</CardTitle>
              <CardDescription className="text-blue-600">
                Best performing products in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">{product.name}</p>
                        <p className="text-sm text-blue-600">
                          {product.quantity} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-700">
                        N${product.revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Types Distribution */}
          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50">
            <CardHeader>
              <CardTitle className="text-blue-800">Customer Types Distribution</CardTitle>
              <CardDescription className="text-blue-600">
                Breakdown of customers by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.customerTypes.map((type, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800 font-medium">{type.type}</span>
                      <span className="text-blue-600">{type.count} customers</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${type.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-500">{type.percentage.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Trend and Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Trend */}
          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50">
            <CardHeader>
              <CardTitle className="text-blue-800">Sales Trend</CardTitle>
              <CardDescription className="text-blue-600">
                Monthly sales and orders overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.salesByMonth.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">{month.month}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-700">N${month.sales.toFixed(2)}</p>
                      <p className="text-sm text-blue-600">{month.orders} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50">
            <CardHeader>
              <CardTitle className="text-blue-800">Recent Orders</CardTitle>
              <CardDescription className="text-blue-600">
                Latest transactions in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {analyticsData.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-blue-800 text-sm">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-blue-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                                              <p className="font-bold text-blue-700 text-sm">
                          N${order.total_amount.toFixed(2)}
                        </p>
                      <Badge 
                        variant={order.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShopOwnerAnalytics;
