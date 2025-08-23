import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { addDays, subDays, format } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  salesByCategory: Array<{
    category: string;
    revenue: number;
    orders: number;
  }>;
  customerGrowth: Array<{
    month: string;
    customers: number;
  }>;
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [period, setPeriod] = useState("30d");
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const fromDate = dateRange?.from || subDays(new Date(), 30);
      const toDate = dateRange?.to || new Date();

      // Fetch revenue and orders data
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            total_price,
            product_snapshot
          )
        `)
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString())
        .not("status", "eq", "cancelled");

      if (ordersError) throw ordersError;

      // Fetch total customers
      const { count: totalCustomers, error: customersError } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

      if (customersError) throw customersError;

      // Fetch total products
      const { count: totalProducts, error: productsError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      if (productsError) throw productsError;

      // Process the data
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalOrders = ordersData?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Top selling products
      const productSales: { [key: string]: { quantity: number; revenue: number; name: string } } = {};
      ordersData?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const productName = item.product_snapshot?.name || "Unknown Product";
          if (!productSales[productName]) {
            productSales[productName] = { quantity: 0, revenue: 0, name: productName };
          }
          productSales[productName].quantity += item.quantity;
          productSales[productName].revenue += item.total_price;
        });
      });

      const topSellingProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Revenue by day
      const revenueByDay: { [key: string]: { revenue: number; orders: number } } = {};
      ordersData?.forEach(order => {
        const date = format(new Date(order.created_at), "yyyy-MM-dd");
        if (!revenueByDay[date]) {
          revenueByDay[date] = { revenue: 0, orders: 0 };
        }
        revenueByDay[date].revenue += order.total_amount || 0;
        revenueByDay[date].orders += 1;
      });

      const revenueByDayArray = Object.entries(revenueByDay)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Fetch categories for sales by category
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*");

      if (categoriesError) throw categoriesError;

      // Sales by category (mock data for now)
      const salesByCategory = categoriesData?.slice(0, 5).map((category, index) => ({
        category: category.name,
        revenue: Math.random() * 10000,
        orders: Math.floor(Math.random() * 100)
      })) || [];

      // Customer growth (mock data)
      const customerGrowth = Array.from({ length: 6 }, (_, i) => ({
        month: format(subDays(new Date(), i * 30), "MMM yyyy"),
        customers: Math.floor(Math.random() * 50) + 20
      })).reverse();

      setAnalyticsData({
        totalRevenue,
        totalOrders,
        totalCustomers: totalCustomers || 0,
        totalProducts: totalProducts || 0,
        averageOrderValue,
        topSellingProducts,
        revenueByDay: revenueByDayArray,
        salesByCategory,
        customerGrowth
      });

    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      if (!analyticsData) return;

      const reportData = {
        period: `${format(dateRange?.from || new Date(), "MMM dd, yyyy")} - ${format(dateRange?.to || new Date(), "MMM dd, yyyy")}`,
        summary: {
          totalRevenue: analyticsData.totalRevenue,
          totalOrders: analyticsData.totalOrders,
          totalCustomers: analyticsData.totalCustomers,
          averageOrderValue: analyticsData.averageOrderValue
        },
        topProducts: analyticsData.topSellingProducts,
        salesByCategory: analyticsData.salesByCategory
      };

      // Create and download JSON report
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `analytics-report-${format(new Date(), "yyyy-MM-dd")}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast({
        title: "Report Generated",
        description: "Analytics report has been downloaded",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    }
  };

  const revenueChartData = {
    labels: analyticsData?.revenueByDay.map(item => format(new Date(item.date), "MMM dd")) || [],
    datasets: [
      {
        label: 'Revenue (N$)',
        data: analyticsData?.revenueByDay.map(item => item.revenue) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const ordersChartData = {
    labels: analyticsData?.revenueByDay.map(item => format(new Date(item.date), "MMM dd")) || [],
    datasets: [
      {
        label: 'Orders',
        data: analyticsData?.revenueByDay.map(item => item.orders) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const categoryChartData = {
    labels: analyticsData?.salesByCategory.map(item => item.category) || [],
    datasets: [
      {
        data: analyticsData?.salesByCategory.map(item => item.revenue) || [],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-2">Track your business performance and generate insights</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {period === "custom" && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N${analyticsData?.totalRevenue.toFixed(2) || "0.00"}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalOrders || 0}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +8% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalCustomers || 0}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +15% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N${analyticsData?.averageOrderValue.toFixed(2) || "0.00"}</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="mr-1 h-3 w-3" />
              -2% from last period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line data={revenueChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders Volume</CardTitle>
            <CardDescription>Daily order count over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={ordersChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution across product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products by quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData?.topSellingProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.quantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">N${product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}