import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  Eye, 
  EyeOff,
  UserCheck,
  Building2,
  AlertCircle,
  ArrowLeft
} from "lucide-react";

const CustomerAuth = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    shopName: ""
  });
  const [autoPopulatedShop, setAutoPopulatedShop] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.shopName.trim()) {
        throw new Error("Please enter the shop name you shop at");
      }

      console.log("Attempting sign in for:", formData.email, "at shop:", formData.shopName);
      
      // First, let's check if the user exists and get their profile
      console.log("Checking if user exists...");
      const { data: existingUser, error: userCheckError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (userCheckError) {
        console.error("Auth error:", userCheckError);
        
        // Check if it's a password issue
        if (userCheckError.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please check your credentials or use the password reset option below.");
        }
        
        throw userCheckError;
      }

      console.log("Auth successful, user ID:", existingUser.user.id);

      // Get user profile to check role and shop
      console.log("Fetching user profile...");
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("role, shop_id, first_name, last_name")
        .eq("id", existingUser.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        await supabase.auth.signOut();
        throw new Error("Failed to load profile. Please contact your shop owner.");
      }

      if (!userProfile) {
        console.log("No profile found for user");
        await supabase.auth.signOut();
        throw new Error("Profile not found. Please complete your account setup first.");
      }

      console.log("User profile loaded:", userProfile);

      if (userProfile?.role !== 'customer') {
        await supabase.auth.signOut();
        throw new Error("Access denied. This portal is for shop customers only.");
      }

      // Auto-populate shop name if not provided - DO THIS FIRST
      if (!formData.shopName.trim() && userProfile.shop_id) {
        console.log("Auto-populating shop name from profile...");
        const { data: userShopData, error: userShopError } = await supabase
          .from("shops")
          .select("name")
          .eq("id", userProfile.shop_id)
          .single();
        
        console.log("Auto-population result:", { userShopData, userShopError });
        
        if (!userShopError && userShopData) {
          formData.shopName = userShopData.name;
          setAutoPopulatedShop(userShopData.name);
          console.log("Auto-populated shop name:", userShopData.name);
          console.log("Updated formData.shopName:", formData.shopName);
        } else {
          console.error("Failed to auto-populate shop name:", userShopError);
        }
      }

      // Skip shop search if we auto-populated the shop name
      if (formData.shopName.trim() && autoPopulatedShop) {
        console.log("Shop name auto-populated, skipping search and proceeding with profile shop_id");
        // Use the profile shop_id directly instead of searching by name
        const userShop = {
          id: userProfile.shop_id,
          name: formData.shopName
        };
        
        console.log("Using auto-populated shop:", userShop);
        
        // Continue to success flow
        toast({
          title: `Welcome back, ${userProfile.first_name}!`,
          description: `You have been successfully signed in to ${userShop.name}.`
        });

        // Navigate to customer dashboard
        navigate(`/shop/${userProfile.shop_id}/customer-dashboard`);
        return; // Exit early, don't continue with shop search
      }

      // Now find the shop by name - try multiple search strategies
      console.log("Searching for shop:", formData.shopName);
      console.log("Shop name length:", formData.shopName.length);
      console.log("Shop name characters:", Array.from(formData.shopName).map(c => c.charCodeAt(0)));
      
      // Test direct query first
      console.log("Testing direct query...");
      const testQuery = await supabase
        .from("shops")
        .select("id, name")
        .eq("name", formData.shopName);
      
      console.log("Direct test query result:", testQuery);
      
      // Test RLS policies by checking if we can see any shops
      console.log("Testing RLS policies...");
      const allShopsTest = await supabase
        .from("shops")
        .select("id, name")
        .limit(5);
      
      console.log("All shops test result:", allShopsTest);
      
      // Test if we can query the specific shop by ID (should work)
      console.log("Testing shop query by ID...");
      const shopByIdTest = await supabase
        .from("shops")
        .select("id, name")
        .eq("id", userProfile.shop_id);
      
      console.log("Shop by ID test result:", shopByIdTest);
      
      // First try exact match
      let { data: shops, error: shopError } = await supabase
        .from("shops")
        .select("id, name")
        .eq("name", formData.shopName);

      console.log("Exact match result:", { shops, shopError, shopCount: shops?.length || 0 });

      // If no exact match, try partial match
      if (!shops || shops.length === 0) {
        console.log("No exact match, trying partial match...");
        const { data: partialShops, error: partialError } = await supabase
          .from("shops")
          .select("id, name")
          .ilike("name", `%${formData.shopName}%`);
        
        console.log("Partial match result:", { partialShops, partialError, partialCount: partialShops?.length || 0 });
        
        if (partialError) {
          console.error("Partial shop search error:", partialError);
          await supabase.auth.signOut();
          throw new Error("Failed to find shop. Please check the shop name.");
        }
        
        shops = partialShops;
        shopError = partialError;
      }

      // Debug: Log the final shops variable
      console.log("Final shops variable:", shops);
      console.log("Final shops type:", typeof shops);
      console.log("Final shops length:", shops?.length);
      console.log("Final shops is array:", Array.isArray(shops));

      // If multiple shops found, prioritize the user's specific shop
      if (shops && shops.length > 1) {
        console.log("Multiple shops found, prioritizing user's specific shop...");
        const userSpecificShop = shops.find(shop => shop.id === userProfile.shop_id);
        if (userSpecificShop) {
          console.log("Prioritizing user's shop:", userSpecificShop.name);
          shops = [userSpecificShop]; // Only keep the user's specific shop
        }
      }

      console.log("After prioritization - shops:", shops);
      console.log("After prioritization - shops length:", shops?.length);

      if (shopError) {
        console.error("Shop search error:", shopError);
        await supabase.auth.signOut();
        throw new Error("Failed to find shop. Please check the shop name.");
      }

      if (!shops || shops.length === 0) {
        console.log("No shops found with name:", formData.shopName);
        console.log("Final shops check - shops:", shops);
        console.log("Final shops check - length:", shops?.length);
        console.log("Final shops check - is null:", shops === null);
        console.log("Final shops check - is undefined:", shops === undefined);
        await supabase.auth.signOut();
        throw new Error("Shop not found. Please check the shop name or contact your shop owner.");
      }

      console.log("Found shops:", shops);

      // Check if user belongs to this shop - handle duplicate shop names
      let userShop = shops.find(shop => shop.id === userProfile.shop_id);
      
      // If no direct match and multiple shops with same name, prioritize user's shop
      if (!userShop && shops.length > 1) {
        console.log("Multiple shops with same name detected, prioritizing user's specific shop...");
        userShop = shops.find(shop => shop.id === userProfile.shop_id);
      }
      
      if (!userShop) {
        console.log("User shop_id:", userProfile.shop_id, "Available shops:", shops.map(s => ({ id: s.id, name: s.name })));
        await supabase.auth.signOut();
        throw new Error("You don't have access to this shop. Please contact your shop owner.");
      }

      console.log("Shop access verified:", userShop.name);

      toast({
        title: `Welcome back, ${userProfile.first_name}!`,
        description: `You have been successfully signed in to ${userShop.name}.`
      });

      // Navigate to customer dashboard
      navigate(`/shop/${userProfile.shop_id}/customer-dashboard`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email.trim()) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address first"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/password-reset`
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Please check your email for password reset instructions"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error.message || "Failed to send password reset email"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-900 to-red-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ShoppingBag className="h-16 w-16 text-pink-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Customer Portal</h1>
          <h2 className="text-2xl font-semibold text-pink-400 mb-2">Shop Access</h2>
          <p className="text-pink-100">
            Access your customer dashboard to view orders and manage your account
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-gray-800">
              <UserCheck className="h-6 w-6 text-pink-600" />
              <span>Customer Sign In</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign in with your customer credentials and specify your shop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopName" className="text-gray-700">Shop Name *</Label>
                <div className="relative">
                  <Input
                    id="shopName"
                    type="text"
                    value={formData.shopName}
                    onChange={(e) => handleInputChange("shopName", e.target.value)}
                    placeholder="Enter your shop name"
                    required
                    readOnly={!!autoPopulatedShop}
                    className={`border-gray-300 focus:border-pink-500 pl-10 ${autoPopulatedShop ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {autoPopulatedShop ? (
                  <p className="text-xs text-green-600">✓ Shop name auto-detected from your account</p>
                ) : (
                  <p className="text-xs text-gray-500">Enter the exact name of the shop you shop at</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="customer@yourshop.com"
                  required
                  className="border-gray-300 focus:border-pink-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="border-gray-300 focus:border-pink-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
                size="lg"
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={handlePasswordReset}
                  disabled={loading}
                  className="text-pink-600 hover:text-pink-700"
                >
                  Forgot your password?
                </Button>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <span className="text-pink-600 font-medium">
                    Contact your shop owner to get invited
                  </span>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-pink-50 border-pink-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-pink-600 mt-0.5" />
              <div className="text-sm text-pink-800">
                <p className="font-medium">Customer Account Required</p>
                <p className="mt-1">
                  You need to be invited by your shop owner to create a customer account. 
                  Please contact them to get started.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-pink-100 hover:text-white hover:bg-pink-800/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
