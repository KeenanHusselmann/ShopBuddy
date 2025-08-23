import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Users, 
  Store, 
  ShoppingBag, 
  BarChart3, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Shield,
  RefreshCw,
  LogOut,
  ArrowLeft,
  User,
  Settings,
  FileText,
  AlertTriangle,
  Building2,
  CheckCircle
} from "lucide-react";
import { HeaderWithNav } from "@/components/common/HeaderWithNav";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface ActivityItem {
  id: string;
  type: 'registration' | 'shop' | 'system';
  action: string;
  displayName: string;
  status: string;
  date: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  description?: string;
  reason?: string;
  admin_notes?: string;
  performed_by?: string;
  performed_by_role?: string;
  additional_details?: any;
}

interface AnalyticsData {
  totalShops: number;
  activeShops: number;
  revokedShops: number;
  verifiedShops: number;
  deletedShops: number;
  totalCustomers: number;
  totalStaff: number;
  totalProducts: number;
  totalOrders: number;
  monthlyRegistrations: number[];
  businessTypeDistribution: Record<string, number>;
  locationDistribution: Record<string, number>;
  recentActivity: ActivityItem[];
}

const AdminAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [isActivityDetailsDialogOpen, setIsActivityDetailsDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUserAccess();
  }, []);

  // Add a focus listener to refresh data when the page becomes visible
  useEffect(() => {
    const handleFocus = () => {
      if (profile) {
        fetchAnalyticsData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [profile]);

  // Refresh data when component mounts or when navigating to this page
  useEffect(() => {
    if (profile && !loading) {
      fetchAnalyticsData();
    }
  }, [profile, loading]);

  // Force refresh every time the page is accessed
  useEffect(() => {
    const handlePageShow = () => {
      if (profile) {
        console.log("Page became visible, refreshing analytics data...");
        fetchAnalyticsData();
      }
    };

    // Also refresh when the component mounts
    if (profile) {
      console.log("Component mounted, refreshing analytics data...");
      fetchAnalyticsData();
    }

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [profile]);

  const checkUserAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/admin-login");
        return;
      }

      setUser(user);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || profileData.role !== 'super_admin') {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You need super admin privileges to access this page."
        });
        navigate("/admin");
        return;
      }

      setProfile(profileData);
      await fetchAnalyticsData();
    } catch (error) {
      console.error("Error checking user access:", error);
      navigate("/admin-login");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setRefreshing(true);

      // Fetch shops data
      const { data: shops } = await supabase
        .from("shops")
        .select("*");

      // Fetch customers data
      const { data: customers } = await supabase
        .from("customer_profiles")
        .select("*");

      // Fetch staff data
      const { data: staff } = await supabase
        .from("staff_credentials")
        .select("*");

      // Fetch products data
      const { data: products } = await supabase
        .from("products")
        .select("*");

      // Fetch orders data
      const { data: orders } = await supabase
        .from("customer_orders")
        .select("*");

      // Fetch registration requests
      const { data: registrations } = await supabase
        .from("shop_registration_requests")
        .select("*");

             // Combine shops and approved registrations for accurate counts, excluding inactive, suspended, rejected, and under_review ones
       const activeShops = (shops || []).filter(s => s.status !== 'inactive' && s.status !== 'suspended' && s.status !== 'deleted');
       const activeRegistrations = (registrations || []).filter(r => r.status === 'approved' && r.status !== 'rejected' && r.status !== 'under_review' && r.status !== 'deleted');
       const allShops = [...activeShops, ...activeRegistrations];
      
             // Process analytics data
       const data: AnalyticsData = {
         totalShops: allShops.length,
         activeShops: allShops.filter(s => s.status === 'active' || s.status === 'approved' || !s.status).length,
         revokedShops: allShops.filter(s => s.status === 'revoked').length,
         verifiedShops: allShops.filter(s => s.is_verified).length,
         deletedShops: 0, // We'll calculate this based on the difference
         totalCustomers: customers?.length || 0,
         totalStaff: staff?.length || 0,
         totalProducts: products?.length || 0,
         totalOrders: orders?.length || 0,
         monthlyRegistrations: calculateMonthlyRegistrations(registrations || []),
         businessTypeDistribution: calculateBusinessTypeDistribution(allShops),
         locationDistribution: calculateLocationDistribution(allShops),
         recentActivity: generateRecentActivity(allShops, registrations || [], orders || [])
       };

      setAnalyticsData(data);
      setLastRefresh(Date.now());
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load analytics data"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const calculateMonthlyRegistrations = (registrations: any[]) => {
    const months = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    
    console.log("Calculating monthly registrations for year:", currentYear);
    console.log("Total registrations to process:", registrations.length);
    
    registrations.forEach(reg => {
      const date = new Date(reg.created_at);
      console.log("Registration date:", reg.created_at, "Parsed date:", date, "Year:", date.getFullYear(), "Month:", date.getMonth());
      
      if (date.getFullYear() === currentYear) {
        months[date.getMonth()]++;
        console.log(`Incremented month ${date.getMonth()} (${date.toLocaleDateString('en-US', { month: 'short' })}) to ${months[date.getMonth()]}`);
      }
    });
    
    console.log("Final monthly counts:", months);
    return months;
  };

  const calculateBusinessTypeDistribution = (shops: any[]) => {
    return shops.reduce((acc, shop) => {
      const businessType = shop.business_type || shop.type;
      if (businessType) {
        acc[businessType] = (acc[businessType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  };

  const calculateLocationDistribution = (shops: any[]) => {
    return shops.reduce((acc, shop) => {
      // Handle both shop and registration address structures
      const city = shop.business_address?.city || shop.business_address?.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const generateRecentActivity = (shops: any[], registrations: any[], orders: any[]) => {
    const activities = [
      ...shops.map(shop => ({
        type: 'shop',
        action: 'registered',
        name: shop.name || shop.shop_name || 'Unknown Shop',
        timestamp: shop.created_at || shop.registration_date,
        status: shop.status
      })),
      ...registrations.map(reg => ({
        type: 'registration',
        action: reg.status,
        name: reg.shop_name || 'Unknown Shop',
        timestamp: reg.created_at,
        status: reg.status
      })),
      ...orders.map(order => ({
        type: 'order',
        action: 'placed',
        name: `Order #${order.id.slice(0, 8)}`,
        timestamp: order.created_at,
        status: order.status
      }))
    ];

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/admin-login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    setIsActivityDetailsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const userProfile = {
    first_name: profile?.first_name || "Admin",
    last_name: profile?.last_name || "",
    email: profile?.email || "",
    role: profile?.role || "super_admin",
    avatar_url: profile?.avatar_url || null
  };

  return (
    <AuthGuard requiredRole={['super_admin']}>
      <div className="min-h-screen bg-background">
        <HeaderWithNav
          title="ShopBuddy"
          user={userProfile}
          onSignOut={handleLogout}
        />
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/admin")}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold flex items-center">
                  <TrendingUp className="h-10 w-10 text-primary mr-3" />
                  System Analytics
                </h1>
                                 <p className="text-xl text-muted-foreground mt-2">
                   Comprehensive insights into ShopBuddy system performance
                 </p>
                 {lastRefresh > 0 && (
                   <p className="text-sm text-muted-foreground">
                     Last updated: {new Date(lastRefresh).toLocaleTimeString()}
                   </p>
                 )}
                 <p className="text-xs text-muted-foreground">
                   Use "Force Refresh" if data seems outdated after deletions
                 </p>
              </div>
            </div>
            <div className="flex gap-3">
                             <Button 
                 onClick={fetchAnalyticsData} 
                 variant="outline" 
                 disabled={refreshing}
               >
                 <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                 {refreshing ? 'Refreshing...' : 'Refresh'}
               </Button>
               <Button 
                 onClick={() => {
                   setAnalyticsData(null);
                   setLastRefresh(0);
                   setTimeout(() => fetchAnalyticsData(), 100);
                 }} 
                 variant="outline" 
                 disabled={refreshing}
               >
                 <RefreshCw className="h-4 w-4 mr-2" />
                 Force Refresh
               </Button>
              <Button onClick={handleLogout} variant="destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {analyticsData && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Store className="h-8 w-8 text-blue-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Shops</p>
                        <p className="text-2xl font-bold">{analyticsData.totalShops}</p>
                        <p className="text-xs text-muted-foreground">
                          {analyticsData.activeShops} active, {analyticsData.revokedShops} revoked
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold">
                          {analyticsData.totalCustomers + analyticsData.totalStaff}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {analyticsData.totalCustomers} customers, {analyticsData.totalStaff} staff
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <ShoppingBag className="h-8 w-8 text-purple-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Products & Orders</p>
                        <p className="text-2xl font-bold">{analyticsData.totalProducts}</p>
                        <p className="text-xs text-muted-foreground">
                          {analyticsData.totalOrders} total orders
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Shield className="h-8 w-8 text-orange-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Verified Shops</p>
                        <p className="text-2xl font-bold">{analyticsData.verifiedShops}</p>
                        <p className="text-xs text-muted-foreground">
                          {analyticsData.totalShops > 0 ? 
                            Math.round((analyticsData.verifiedShops / analyticsData.totalShops) * 100) : 0
                          }% verification rate
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Business Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Store className="h-5 w-5 mr-2" />
                      Business Type Distribution
                    </CardTitle>
                    <CardDescription>
                      Distribution of shops by business type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analyticsData.businessTypeDistribution).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="capitalize">{type}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ 
                                  width: `${(count / analyticsData.totalShops) * 100}%` 
                                }}
                              ></div>
                            </div>
                            <span className="font-semibold w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Location Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Location Distribution
                    </CardTitle>
                    <CardDescription>
                      Shops by city/location
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analyticsData.locationDistribution)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10)
                        .map(([city, count]) => (
                          <div key={city} className="flex items-center justify-between">
                            <span>{city}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Registration Trends */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Monthly Registration Trends
                  </CardTitle>
                  <CardDescription>
                    Shop registration requests by month (current year)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end space-x-2 h-32">
                    {analyticsData.monthlyRegistrations.map((count, index) => {
                      const maxCount = Math.max(...analyticsData.monthlyRegistrations);
                      const heightPercentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      const currentYear = new Date().getFullYear();
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                            style={{ 
                              height: `${Math.max(heightPercentage, 5)}%`,
                              minHeight: count > 0 ? '8px' : '2px'
                            }}
                          ></div>
                          <span className="text-xs text-muted-foreground mt-2">
                            {new Date(currentYear, index).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-xs font-medium text-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Recent System Activity
                  </CardTitle>
                  <CardDescription>
                    Latest activities across the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.recentActivity.map((activity, index) => (
                      <div 
                        key={index} 
                        className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors duration-200 cursor-pointer group"
                        onClick={() => handleActivityClick(activity)}
                      >
                        <div className={`w-3 h-3 rounded-full ${
                          activity.type === 'shop' ? 'bg-blue-500' :
                          activity.type === 'registration' ? 'bg-green-500' :
                          'bg-purple-500'
                        }`}></div>
                        <span className="text-sm text-slate-200 flex-1">
                          <span className="font-medium capitalize text-white group-hover:text-blue-300 transition-colors">{activity.action}</span>
                          {' '}{activity.name}
                        </span>
                        <Badge variant="secondary" className="ml-auto bg-slate-600 text-slate-200 border-slate-500">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </Badge>
                        <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors ml-2">
                          Click for details →
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminAnalytics;
