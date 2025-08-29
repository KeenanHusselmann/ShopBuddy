import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  LogOut,
  User,
  Store
} from "lucide-react";
import { HeaderWithNav } from "@/components/common/HeaderWithNav";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface StaffProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  shop_id: string;
}

interface Shop {
  id: string;
  name: string;
  description?: string;
}

const StaffDashboard = () => {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile with shop details
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, shops(*)")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      setShop(profileData?.shops);

      if (profileData?.shop_id) {
        // Fetch basic stats for the shop
        const [productsRes, ordersRes, customersRes] = await Promise.all([
          supabase
            .from("products")
            .select("id", { count: "exact" })
            .eq("shop_id", profileData.shop_id),
          supabase
            .from("orders")
            .select("id", { count: "exact" })
            .eq("shop_id", profileData.shop_id),
          supabase
            .from("customers")
            .select("id", { count: "exact" })
            .eq("shop_id", profileData.shop_id)
        ]);

        setStats({
          products: productsRes.count || 0,
          orders: ordersRes.count || 0,
          customers: customersRes.count || 0
        });
      }
    } catch (error) {
      console.error("Error fetching staff data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data"
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
      navigate("/staff-auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userProfile = {
    first_name: profile?.first_name || "Staff",
    last_name: profile?.last_name || "Member",
    email: profile?.email || "",
    role: profile?.role || "staff",
    avatar_url: null
  };

  return (
    <AuthGuard requiredRole={['staff']}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <HeaderWithNav 
          title="ShopBuddy Staff Portal" 
          user={userProfile}
          onSignOut={handleSignOut}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to {shop?.name || "Your Shop"}! 👋
            </h1>
            <p className="text-muted-foreground">
              Staff dashboard for managing shop operations
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.products}</div>
                <p className="text-xs text-muted-foreground">
                  Total inventory items
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.orders}</div>
                <p className="text-xs text-muted-foreground">
                  Total orders processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.customers}</div>
                <p className="text-xs text-muted-foreground">
                  Registered customers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Product Management</span>
                </CardTitle>
                <CardDescription>
                  Manage inventory, add products, and update stock levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate("/products")}
                  className="w-full"
                >
                  Manage Products
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Order Processing</span>
                </CardTitle>
                <CardDescription>
                  View and process customer orders, update order status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate("/orders")}
                  className="w-full"
                >
                  View Orders
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Customer Management</span>
                </CardTitle>
                <CardDescription>
                  View customer information and manage customer relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate("/customers")}
                  className="w-full"
                >
                  Manage Customers
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Point of Sale</span>
                </CardTitle>
                <CardDescription>
                  Process sales, create orders, and manage transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate("/pos")}
                  className="w-full"
                >
                  Open POS
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Staff Info */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Your Staff Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg">{profile?.first_name} {profile?.last_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-lg">{profile?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <Badge variant="secondary" className="capitalize">
                    {profile?.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Shop</p>
                  <div className="flex items-center space-x-2">
                    <Store className="h-4 w-4" />
                    <span>{shop?.name}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
};

export default StaffDashboard;
