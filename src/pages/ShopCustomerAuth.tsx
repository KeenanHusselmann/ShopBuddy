import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ShoppingBag, 
  Eye, 
  EyeOff,
  LogIn,
  ArrowLeft,
  UserCheck,
  AlertCircle,
  Building2,
  Heart,
  Star
} from "lucide-react";

const ShopCustomerAuth = () => {
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

      console.log("Attempting customer sign in for:", formData.email, "at shop:", formData.shopName);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        console.error("Auth error:", error);
        
        // Check if it's a password issue
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please check your credentials or use the password reset option below.");
        }
        
        throw error;
      }

      console.log("Auth successful, user ID:", data.user.id);

      // First, find the shop by name (more flexible matching)
      const { data: shops, error: shopError } = await supabase
        .from("shops")
        .select("id, name")
        .ilike("name", `%${formData.shopName.trim()}%`);

      if (shopError) {
        await supabase.auth.signOut();
        throw new Error("Failed to search for shops. Please try again.");
      }

      if (!shops || shops.length === 0) {
        await supabase.auth.signOut();
        throw new Error(`No shops found matching "${formData.shopName}". Please check the shop name and try again.`);
      }

      // If multiple shops match, find the best match
      let shop = shops[0];
      if (shops.length > 1) {
        // Find exact match first
        const exactMatch = shops.find(s => 
          s.name.toLowerCase() === formData.shopName.trim().toLowerCase()
        );
        if (exactMatch) {
          shop = exactMatch;
        } else {
          // Find closest match
          const searchTerm = formData.shopName.trim().toLowerCase();
          shop = shops.reduce((best, current) => {
            const currentScore = current.name.toLowerCase().includes(searchTerm) ? 1 : 0;
            const bestScore = best.name.toLowerCase().includes(searchTerm) ? 1 : 0;
            return currentScore > bestScore ? current : best;
          });
        }
      }

      console.log("Shop found:", shop);

      // Verify user is actually a customer of this specific shop
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, shop_id, first_name, last_name, customer_type")
        .eq("id", data.user.id)
        .eq("shop_id", shop.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        await supabase.auth.signOut();
        throw new Error("Failed to load profile. Please contact your shop.");
      }

      if (!profile) {
        console.log("No profile found for this shop");
        await supabase.auth.signOut();
        throw new Error("Profile not found for this shop. Please complete your account setup first.");
      }

      console.log("Profile loaded:", profile);

      if (profile?.role !== 'customer') {
        await supabase.auth.signOut();
        throw new Error("Access denied. This portal is for shop customers only.");
      }

      if (profile.shop_id !== shop.id) {
        await supabase.auth.signOut();
        throw new Error("Access denied. You can only access the shop you were invited to.");
      }

      toast({
        title: `Welcome back, ${profile.first_name}! 🛍️`,
        description: `You have been successfully signed in to ${shop.name}.`
      });

      // Navigate to shop-specific customer dashboard
      navigate(`/shop/${shop.id}/customer-dashboard`);
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      let errorMessage = "Sign in failed";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error_description) {
        errorMessage = error.error_description;
      }

      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your email address first"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/password-reset`
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password reset email sent! 📧",
        description: "Check your email for password reset instructions. You can close this tab and check your email."
      });

    } catch (error: any) {
      console.error("Password reset error:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-16 w-16 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Customer Portal</h1>
          <h2 className="text-2xl font-semibold text-green-400 mb-2">Shop Access</h2>
          <p className="text-green-100">
            Sign in to access your personalized shopping experience
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-gray-800">
              <ShoppingBag className="h-6 w-6 text-green-600" />
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
                    onChange={(e) => setFormData(prev => ({ ...prev, shopName: e.target.value }))}
                    placeholder="Enter your shop name"
                    required
                    className="border-gray-300 focus:border-green-500 pl-10"
                  />
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">Enter the exact name of the shop you shop at</p>
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
                  className="border-gray-300 focus:border-green-500"
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
                    className="border-gray-300 focus:border-green-500 pr-10"
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
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                size="lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                {loading ? "Signing In..." : "Sign In to Shop"}
              </Button>

              {/* Password Reset Section */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center mb-3">
                  Having trouble signing in?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePasswordReset}
                  disabled={loading || !formData.email.trim()}
                  className="w-full text-sm"
                  size="sm"
                >
                  🔑 Reset Password
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  We'll send a password reset link to your email
                </p>
              </div>
            </form>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Customer Access Information:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>You must be invited by your shop</li>
                    <li>Enter the exact name of your shop</li>
                    <li>Use the email address you were invited with</li>
                    <li>Contact your shop if you need access</li>
                    <li>This portal is for shop customers only</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Heart className="h-3 w-3 text-red-400" />
                  <span>Personalized Experience</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-400" />
                  <span>Exclusive Offers</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-green-100 hover:text-white hover:bg-green-800/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShopCustomerAuth;
