import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Store, Eye, EyeOff, LogIn, UserPlus, ArrowLeft, Crown, Users, ShoppingBag, Building2, UserCheck, Heart, Shield } from "lucide-react";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // User is authenticated, redirect based on role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, shop_id, shop_registration_status')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.role === 'super_admin') {
            navigate('/admin');
          } else if (profile.role === 'shop_admin' && profile.shop_id && profile.shop_registration_status === 'completed') {
            navigate('/dashboard');
          } else if (profile.role === 'staff' && profile.shop_id && profile.shop_registration_status === 'completed') {
            navigate('/dashboard');
          } else if (profile.role === 'customer') {
            navigate('/customer-portal');
          } else {
            // Shop owner with pending registration
            navigate('/dashboard');
          }
        }
      }
    };

    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/10 to-background/5 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Store className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ShopBuddy 🇳🇦
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Language Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-3 px-6 rounded-lg">
          <p className="font-medium">
            New local languages coming soon. Oshiwambo, Afrikaans, Herero
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Authentication Portal
          </h1>
          <p className="text-xl text-muted-foreground">
            Select the appropriate portal based on your role in the ShopBuddy system
          </p>
        </div>

        {/* Authentication Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Super Admin Portal */}
          <Card className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <Crown className="h-12 w-12 text-yellow-400" />
              </div>
              <CardTitle className="text-white">ShopBuddy Super Admin</CardTitle>
              <CardDescription className="text-purple-200">
                System administration and shop management oversight
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => navigate("/super-admin-auth")}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Shield className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button 
                onClick={() => navigate("/super-admin-auth")}
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/20"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </Button>
            </CardContent>
          </Card>

          {/* Shop Owner Portal */}
          <Card className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <Building2 className="h-12 w-12 text-blue-400" />
              </div>
              <CardTitle className="text-white">Shop Owners</CardTitle>
              <CardDescription className="text-blue-200">
                Manage your shop operations, staff, and business analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => navigate("/shop-owner-auth")}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button 
                onClick={() => navigate("/shop-owner-auth")}
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/20"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </Button>
            </CardContent>
          </Card>

          {/* Staff Portal */}
          <Card className="bg-gradient-to-br from-green-900 to-teal-900 text-white border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <Users className="h-12 w-12 text-green-400" />
              </div>
              <CardTitle className="text-white">Shop Staff</CardTitle>
              <CardDescription className="text-green-200">
                Access your shop dashboard to help manage daily operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => navigate("/staff-auth")}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <p className="text-xs text-green-300 text-center">
                Staff accounts are created by shop owners
              </p>
            </CardContent>
          </Card>

          {/* Customer Portal */}
          <Card className="bg-gradient-to-br from-pink-900 to-rose-900 text-white border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <ShoppingBag className="h-12 w-12 text-pink-400" />
              </div>
              <CardTitle className="text-white">Shop Customers</CardTitle>
              <CardDescription className="text-pink-200">
                Shop online, track orders, and manage your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => navigate("/customer-auth")}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Heart className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button 
                onClick={() => navigate("/customer-auth")}
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/20"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information Section */}
        <div className="mt-12 bg-muted/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">How the System Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Shop Owners</h4>
              <p>Sign up, register your shop, wait for approval, then manage your business</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Staff Members</h4>
              <p>Get invited by your shop owner to join and help manage operations</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Customers</h4>
              <p>Join your favorite shop to shop online and track your orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;