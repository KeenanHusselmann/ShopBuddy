import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Store, ArrowLeft, Users, ShoppingBag, Building2, UserCheck, Heart } from "lucide-react";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Redirect based on user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, shop_id')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          if (profile.role === 'super_admin') {
            navigate('/admin');
          } else if (profile.role === 'shop_admin') {
            navigate('/shop-owner-dashboard');
          } else if (profile.role === 'staff') {
            navigate(`/shop/${profile.shop_id}/staff-dashboard`);
          } else if (profile.role === 'customer') {
            navigate(`/shop/${profile.shop_id}/customer-dashboard`);
          }
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handlePortalAction = (portal: 'shop_owner' | 'staff' | 'customer', action: 'signin' | 'signup') => {
    if (action === 'signup') {
      // Only shop owners can sign up
      if (portal !== 'shop_owner') {
        toast({
          title: "Information",
          description: "Staff and customers are invited by shop owners. Please contact your shop owner for access.",
        });
        return;
      }
      // Navigate to shop owner signup
      navigate('/shop-owner-auth?mode=signup');
    } else {
      // Navigate to appropriate sign-in page
      if (portal === 'shop_owner') {
        navigate('/shop-owner-auth');
      } else if (portal === 'staff') {
        navigate('/staff-auth');
      } else if (portal === 'customer') {
        navigate('/customer-auth');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <Store className="h-12 w-12 text-primary" />
            <div className="text-center">
              <span className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ShopBuddy
              </span>
              <p className="text-sm text-muted-foreground mt-1">Complete Shop Management Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Welcome to <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ShopBuddy</span>
          </h1>
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            The ultimate platform for modern businesses to manage their shops, staff, customers, and operations with ease.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Streamlined Operations</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>Multi-User Access</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Real-time Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Portals Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Choose Your Portal
          </h2>
          <p className="text-lg text-muted-foreground">
            Select the appropriate portal based on your role in the ShopBuddy ecosystem
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Shop Owner Portal */}
          <Card className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <Building2 className="h-16 w-16 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <CardTitle className="text-white text-2xl">Shop Owners</CardTitle>
              <CardDescription className="text-blue-200 text-base">
                Manage your shop operations, staff, and business analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-blue-100">
                <p>• Complete inventory management</p>
                <p>• Staff and customer management</p>
                <p>• Sales analytics and reporting</p>
                <p>• Multi-location support</p>
              </div>
              <Button 
                onClick={() => handlePortalAction('shop_owner', 'signin')}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 text-lg py-3"
              >
                <Building2 className="h-5 w-5 mr-2" />
                Sign In
              </Button>
              <Button 
                onClick={() => handlePortalAction('shop_owner', 'signup')}
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/20 text-lg py-3"
              >
                <UserCheck className="h-5 w-5 mr-2" />
                Sign Up
              </Button>
            </CardContent>
          </Card>

          {/* Staff Portal */}
          <Card className="bg-gradient-to-br from-green-900 to-teal-900 text-white border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <Users className="h-16 w-16 text-green-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <CardTitle className="text-white text-2xl">Shop Staff</CardTitle>
              <CardDescription className="text-green-200 text-base">
                Access your shop dashboard to help manage daily operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-green-100">
                <p>• Process customer orders</p>
                <p>• Manage inventory levels</p>
                <p>• Customer service tools</p>
                <p>• Sales tracking</p>
              </div>
              <Button 
                onClick={() => handlePortalAction('staff', 'signin')}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 text-lg py-3"
              >
                <UserCheck className="h-5 w-5 mr-2" />
                Sign In
              </Button>
              <p className="text-xs text-green-300 text-center">
                Staff accounts are created by shop owners
              </p>
            </CardContent>
          </Card>

          {/* Customer Portal */}
          <Card className="bg-gradient-to-br from-pink-900 to-rose-900 text-white border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <ShoppingBag className="h-16 w-16 text-pink-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <CardTitle className="text-white text-2xl">Shop Customers</CardTitle>
              <CardDescription className="text-pink-200 text-base">
                Shop online, track orders, and manage your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-pink-100">
                <p>• Browse products online</p>
                <p>• Place and track orders</p>
                <p>• Manage your profile</p>
                <p>• View order history</p>
              </div>
              <Button 
                onClick={() => handlePortalAction('customer', 'signin')}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 text-lg py-3"
              >
                <Heart className="h-5 w-5 mr-2" />
                Sign In
              </Button>
              <p className="text-xs text-pink-300 text-center">
                Customer accounts are created by shop owners
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Why Choose ShopBuddy?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for modern retail businesses, our platform helps you manage every aspect of your business efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-6 rounded-lg bg-card/50 hover:bg-card/80 transition-colors duration-300">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Complete Management</h3>
            <p className="text-sm text-muted-foreground">Manage inventory, staff, customers, and sales from one platform</p>
          </div>
          
          <div className="text-center p-6 rounded-lg bg-card/50 hover:bg-card/80 transition-colors duration-300">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-User Access</h3>
            <p className="text-sm text-muted-foreground">Invite staff members and customers with role-based permissions</p>
          </div>
          
          <div className="text-center p-6 rounded-lg bg-card/50 hover:bg-card/80 transition-colors duration-300">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Customer Portal</h3>
            <p className="text-sm text-muted-foreground">Provide your customers with a seamless shopping experience</p>
          </div>
          
          <div className="text-center p-6 rounded-lg bg-card/50 hover:bg-card/80 transition-colors duration-300">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Scalable Solution</h3>
            <p className="text-sm text-muted-foreground">Grow your business with our flexible and scalable platform</p>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-muted/50 rounded-lg p-8">
          <h3 className="text-2xl font-semibold mb-6 text-center">How the System Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-3 text-foreground">Shop Owners</h4>
              <p>Sign up, register your shop, wait for approval, then manage your business with our comprehensive tools.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-3 text-foreground">Staff Members</h4>
              <p>Get invited by your shop owner to join and help manage daily operations with specialized tools.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-3 text-foreground">Customers</h4>
              <p>Join your favorite shop to shop online, track orders, and manage your account seamlessly.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 ShopBuddy. All rights reserved. | Complete Shop Management Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;