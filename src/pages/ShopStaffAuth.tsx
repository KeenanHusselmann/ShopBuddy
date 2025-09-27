import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Users, 
  Eye, 
  EyeOff,
  LogIn,
  ArrowLeft,
  UserCheck,
  AlertCircle,
  Building2
} from "lucide-react";

const ShopStaffAuth = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shopDetails, setShopDetails] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { shopId } = useParams();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Fetch shop details on component mount
  useEffect(() => {
    if (shopId) {
      fetchShopDetails();
    }
  }, [shopId]);

  const fetchShopDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, description, logo_url")
        .eq("id", shopId)
        .single();

      if (error) throw error;
      setShopDetails(data);
    } catch (error) {
      console.error("Error fetching shop details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load shop information."
      });
    }
  };

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
      console.log("Attempting sign in for:", formData.email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        console.error("Auth error:", error);
        throw error;
      }

      console.log("Auth successful, user ID:", data.user.id);

      // Verify user is actually a staff member of this specific shop
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, shop_id, first_name, last_name")
        .eq("id", data.user.id)
        .eq("shop_id", shopId)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        await supabase.auth.signOut();
        throw new Error("Failed to load profile. Please contact your shop owner.");
      }

      if (!profile) {
        console.log("No profile found for this shop");
        await supabase.auth.signOut();
        throw new Error("Profile not found. Please complete your account setup first.");
      }

      console.log("Profile loaded:", profile);

      if (profile?.role !== 'staff') {
        await supabase.auth.signOut();
        throw new Error("Access denied. This portal is for shop staff members only.");
      }

      if (profile.shop_id !== shopId) {
        await supabase.auth.signOut();
        throw new Error("Access denied. You can only access your assigned shop.");
      }

      toast({
        title: `Welcome back, ${profile.first_name}!`,
        description: `You have been successfully signed in to ${shopDetails?.name || 'your shop'}.`
      });

      // Navigate to shop-specific staff dashboard
      navigate(`/shop/${shopId}/staff-dashboard`);
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

  if (!shopDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading shop information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-16 w-16 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{shopDetails.name}</h1>
          <h2 className="text-2xl font-semibold text-blue-400 mb-2">Staff Portal</h2>
          <p className="text-blue-100">
            Access your shop dashboard to help manage operations
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-gray-800">
              <UserCheck className="h-6 w-6 text-blue-600" />
              <span>Staff Member Sign In</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to access {shopDetails.name} management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="staff@yourshop.com"
                  required
                  className="border-gray-300 focus:border-blue-500"
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
                    className="border-gray-300 focus:border-blue-500 pr-10"
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
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                size="lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Staff Access Information:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>You must be invited by your shop owner</li>
                    <li>Use the email address you were invited with</li>
                    <li>Contact your shop owner if you need access</li>
                    <li>This portal is for {shopDetails.name} staff members only</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                <strong>🏪 Shop-Specific Access:</strong> This portal is for staff members of {shopDetails.name} only.
                <br />
                Each shop has its own dedicated staff portal.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-blue-100 hover:text-white hover:bg-blue-800/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShopStaffAuth;
