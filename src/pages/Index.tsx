import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Package, Users, BarChart3, ArrowRight, CheckCircle, LogIn, Building2, UserCheck, ShoppingBag, Heart, UserPlus } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in (but don't auto-redirect)
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // Get user profile for role-based navigation options
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*, shops(name)")
          .eq("id", session.user.id)
          .single();
        setProfile(profileData);
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        // Get user profile for role-based navigation options
        supabase
          .from("profiles")
          .select("*, shops(name)")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profileData }) => {
            setProfile(profileData);
          });
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigateToDashboard = () => {
    if (profile?.role === 'super_admin') {
      navigate("/admin");
    } else if (profile?.role === 'shop_admin' || profile?.role === 'staff') {
      navigate("/dashboard");
    } else if (profile?.role === 'customer') {
      navigate("/customer-portal");
    } else {
      navigate("/auth");
    }
  };

  const features = [
    {
      icon: Package,
      title: "Inventory Management",
      description: "Track products, stock levels, and automated alerts"
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Customer profiles, purchase history, loyalty programs"
    },
    {
      icon: BarChart3,
      title: "Sales Analytics",
      description: "Real-time reports, revenue tracking, performance insights"
    },
    {
      icon: Store,
      title: "Multi-location Support",
      description: "Manage multiple shop locations from one dashboard"
    }
  ];

  const benefits = [
    "Complete inventory tracking for all products",
    "Automated stock management and alerts",
    "Real-time sales analytics and reporting",
    "Customer loyalty and reward programs",
    "Multi-location management capabilities",
    "Secure payment processing integration"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Store className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ShopBuddy
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                // Authenticated user navigation
                <div className="flex items-center space-x-3">
                  <Badge variant={profile?.role === 'super_admin' ? 'default' : 'secondary'}>
                    {profile?.role === 'super_admin' ? 'Super Admin' : 
                     profile?.role === 'shop_admin' ? 'Shop Owner' : 
                     profile?.role === 'staff' ? 'Staff' : 'Customer'}
                  </Badge>
                  <Button variant="outline" onClick={handleNavigateToDashboard}>
                    Go to Dashboard
                  </Button>
                  <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                // Guest user navigation
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" onClick={() => navigate("/auth")}>
                    Sign In
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/auth")}>
                    Sign Up
                  </Button>

                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-background/5">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 text-9xl font-black text-primary/20 select-none">
              SHOPBUDDY
            </div>
            <div className="absolute bottom-20 right-10 text-9xl font-black text-primary/20 select-none">
              SHOPBUDDY
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Store className="h-20 w-20 text-primary" />
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold mb-6">
            Welcome to <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ShopBuddy</span> 🇳🇦
          </h1>
          
          <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto">
            Complete shop management experience designed specifically for Namibian businesses. 
            Streamline your operations with our comprehensive management platform.
          </p>

          {/* Authentication Portals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">

            {/* Shop Owner Portal */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-center mb-4">
                <Store className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Shop Owners</h3>
              <p className="text-sm text-blue-200 mb-4">
                Manage your shop operations, staff, and business analytics
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate("/shop-owner-auth?mode=signin")}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  size="sm"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate("/shop-owner-auth?mode=signup")}
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/20"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            </div>

            {/* Staff Portal */}
            <div className="bg-gradient-to-br from-green-900 to-teal-900 rounded-xl p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-center mb-4">
                <Users className="h-12 w-12 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Shop Staff</h3>
              <p className="text-sm text-green-200 mb-4">
                Access your shop dashboard to help manage daily operations
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate("/staff-auth")}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  size="sm"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <p className="text-xs text-green-300">
                  Staff accounts are created by shop owners
                </p>
              </div>
            </div>

            {/* Customer Portal */}
            <div className="bg-gradient-to-br from-pink-900 to-rose-900 rounded-xl p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-center mb-4">
                <ShoppingBag className="h-12 w-12 text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Shop Customers</h3>
              <p className="text-sm text-pink-200 mb-4">
                Shop online, track orders, and manage your account
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate("/customer-auth?mode=signin")}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  size="sm"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate("/customer-auth?mode=signup")}
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/20"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Access Info */}
          <div className="bg-muted/50 rounded-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold mb-3">How to Get Started</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary font-bold">1</span>
                </div>
                <p><strong>Shop Owners:</strong> Sign up, register your shop, wait for approval</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary font-bold">2</span>
                </div>
                <p><strong>Staff:</strong> Get invited by your shop owner to join</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary font-bold">3</span>
                </div>
                <p><strong>Customers:</strong> Join your favorite shop to start shopping</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Language Banner */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 text-white">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">🌍</span>
                <span className="text-lg font-semibold">New Local Languages Coming Soon:</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">Oshiwambo</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">Afrikaans</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">Herero</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything Your Shop Needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed specifically for shop owners in Namibia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-card hover:shadow-primary transition-all duration-300">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Choose ShopBuddy?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Built specifically for the Namibian retail industry, our platform helps you manage every aspect of your business efficiently.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:pl-8">
              <Card className="shadow-glow border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl bg-gradient-accent bg-clip-text text-transparent">
                    Ready to Transform Your Business?
                  </CardTitle>
                  <CardDescription className="text-base">
                    Join other successful shop owners in Namibia who trust ShopBuddy to manage their operations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="premium" 
                    size="lg" 
                    className="w-full"
                    onClick={() => navigate("/auth")}
                  >
                    Start Your Free Trial
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    No setup fees • 30-day free trial • Cancel anytime
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Store className="h-8 w-8 text-primary" />
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  ShopBuddy
                </span>
                {/* Namibian Flag Emoji */}
                <span className="text-2xl">🇳🇦</span>
              </div>
            </div>
            <p className="text-muted-foreground">
              © 2024 Driven Technologies CC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
