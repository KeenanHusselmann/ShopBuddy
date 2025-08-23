import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Store,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  UserPlus,
  Building2,
  Clock,
  CheckCircle
} from "lucide-react";
import { HeaderWithNav } from "@/components/common/HeaderWithNav";

interface ShopStats {
  totalProducts: number;
  totalStaff: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<ShopStats>({
    totalProducts: 0,
    totalStaff: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [profile, setProfile] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile with shop details
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*, shops(*)")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      setShop(profileData?.shops);

      if (profileData?.shop_id) {
        // Fetch shop statistics
        const [productsRes, staffRes, customersRes, ordersRes] = await Promise.all([
          supabase.from("products").select("*", { count: 'exact' }).eq("shop_id", profileData.shop_id),
          supabase.from("profiles").select("*", { count: 'exact' }).eq("shop_id", profileData.shop_id).eq("role", "staff"),
          supabase.from("customers").select("*", { count: 'exact' }).eq("shop_id", profileData.shop_id),
          supabase.from("orders").select("total_amount", { count: 'exact' }).eq("shop_id", profileData.shop_id)
        ]);

        setStats({
          totalProducts: productsRes.count || 0,
          totalStaff: staffRes.count || 0,
          totalCustomers: customersRes.count || 0,
          totalOrders: ordersRes.count || 0,
          totalRevenue: ordersRes.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load user data"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out"
      });
    } else {
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show shop registration prompt if user doesn't have a shop yet
  if (!profile?.shop_id) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Store className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome to ShopBuddy! 🇳🇦</h1>
            <p className="text-xl text-muted-foreground mb-6">
              To get started with managing your shop, you need to register your business first.
            </p>
            

            
            {profile?.shop_registration_status === 'pending' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Registration Under Review
                </h2>
                <p className="text-yellow-700">
                  Your shop registration is currently under review by ShopBuddy administrators. 
                  You'll be notified once it's approved. This usually takes 1-2 business days.
                </p>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• ShopBuddy super admin reviews your application</li>
                    <li>• Once approved, you'll have access to your shop dashboard</li>
                    <li>• You can then manage products, staff, and track analytics</li>
                    <li>• Staff members can be invited to help manage operations</li>
                  </ul>
                </div>
              </div>
            ) : (
              <Button 
                onClick={() => navigate("/shop-registration")}
                size="lg"
                className="text-lg px-8 py-4"
              >
                <Store className="h-5 w-5 mr-2" />
                Register Your Shop
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const userProfile = {
    first_name: profile?.first_name || "User",
    last_name: profile?.last_name || "",
    email: profile?.email || "",
    role: profile?.role || "staff",
    avatar_url: profile?.avatar_url || null
  };

  return (
    <AuthGuard requiredRole={['shop_admin', 'staff', 'super_admin']}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <HeaderWithNav 
          title="ShopBuddy" 
          user={userProfile}
          onSignOut={handleSignOut}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to {shop?.name || "Your Shop"}! 🇳🇦
            </h1>
            <p className="text-muted-foreground">
              Manage your shop operations, staff, and track performance
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">Total inventory items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStaff}</div>
                <p className="text-xs text-muted-foreground">Team members</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">Registered customers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">Total orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">NAD {stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total revenue</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/products")}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Products</span>
                </CardTitle>
                <CardDescription>Manage inventory and products</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/categories")}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Categories</span>
                </CardTitle>
                <CardDescription>Organize your products</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/customers")}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Customers</span>
                </CardTitle>
                <CardDescription>Manage customer relationships</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/analytics")}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Analytics</span>
                </CardTitle>
                <CardDescription>View performance insights</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Staff Management Section (Only for Shop Owners) */}
          {profile?.role === 'shop_admin' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Staff Management</span>
                </CardTitle>
                <CardDescription>
                  Invite and manage your shop staff members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      You currently have {stats.totalStaff} staff member{stats.totalStaff !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Staff members can help manage products, customers, and orders
                    </p>
                  </div>
                  <Button onClick={() => navigate("/staff-management")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Panel Card (Only for Super Admin) */}
          {profile?.role === 'super_admin' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Admin Panel</span>
                </CardTitle>
                <CardDescription>
                  Access ShopBuddy system administration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Manage shop registrations and system settings
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Approve new shops and monitor platform health
                    </p>
                  </div>
                  <Button onClick={() => navigate("/admin")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Go to Admin
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your shop</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Activity tracking coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;