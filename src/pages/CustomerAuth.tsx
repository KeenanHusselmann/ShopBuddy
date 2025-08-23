import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ShoppingBag, 
  Eye, 
  EyeOff,
  LogIn,
  UserPlus,
  ArrowLeft,
  Heart,
  AlertCircle
} from "lucide-react";

const CustomerAuth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check URL parameters to determine initial mode
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    } else if (mode === 'signin') {
      setIsSignUp(false);
    }
  }, [searchParams]);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    phone: "",
    shop_id: ""
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
      // Customers use the customer_accounts table for authentication
      // This is a simplified version - in production you'd want a proper customer auth system
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      // Verify user is actually a customer
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== 'customer') {
        await supabase.auth.signOut();
        throw new Error("Access denied. This portal is for shop customers only.");
      }

      toast({
        title: "Welcome back, Customer!",
        description: "You have been successfully signed in to your customer portal."
      });

      navigate("/customer-portal");
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirm_password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match"
      });
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters long"
      });
      setLoading(false);
      return;
    }

    if (!formData.shop_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a shop to join"
      });
      setLoading(false);
      return;
    }

    try {
      // Create customer account using the database function
      const { data, error } = await supabase.rpc('create_customer_account', {
        shop_id_param: formData.shop_id,
        email_param: formData.email,
        password_param: formData.password,
        first_name_param: formData.first_name,
        last_name_param: formData.last_name,
        phone_param: formData.phone || null,
        address_param: null
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Customer Account Created!",
          description: "Please check your email to verify your account before signing in."
        });

        // Reset form
        setFormData({
          email: "",
          password: "",
          confirm_password: "",
          first_name: "",
          last_name: "",
          phone: "",
          shop_id: ""
        });

        // Switch to sign in
        setIsSignUp(false);
      } else {
        throw new Error(data.error || "Failed to create account");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message
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
          <h1 className="text-4xl font-bold text-white mb-2">ShopBuddy</h1>
          <h2 className="text-2xl font-semibold text-pink-400 mb-2">Customer Portal</h2>
          <p className="text-pink-100">
            {isSignUp ? "Join your favorite shop as a customer" : "Access your customer dashboard"}
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-gray-800">
              <Heart className="h-6 w-6 text-pink-600" />
              <span>{isSignUp ? "Create Customer Account" : "Customer Sign In"}</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isSignUp 
                ? "Join a shop to start shopping and tracking your orders" 
                : "Sign in to view your orders and manage your account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-gray-700">First Name *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange("first_name", e.target.value)}
                        placeholder="Enter first name"
                        required
                        className="border-gray-300 focus:border-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-gray-700">Last Name *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange("last_name", e.target.value)}
                        placeholder="Enter last name"
                        required
                        className="border-gray-300 focus:border-pink-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+264 XX XXX XXXX"
                      className="border-gray-300 focus:border-pink-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shop_id" className="text-gray-700">Select Shop *</Label>
                    <Input
                      id="shop_id"
                      value={formData.shop_id}
                      onChange={(e) => handleInputChange("shop_id", e.target.value)}
                      placeholder="Enter shop ID or name"
                      required
                      className="border-gray-300 focus:border-pink-500"
                    />
                    <p className="text-xs text-gray-500">
                      Ask your shop owner for the shop ID or name
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="customer@example.com"
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
                {isSignUp && (
                  <p className="text-xs text-gray-500">
                    Password must be at least 6 characters long
                  </p>
                )}
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="text-gray-700">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirm_password}
                      onChange={(e) => handleInputChange("confirm_password", e.target.value)}
                      placeholder="Confirm your password"
                      required
                      className="border-gray-300 focus:border-pink-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
                size="lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  isSignUp ? <UserPlus className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />
                )}
                {loading 
                  ? (isSignUp ? "Creating Account..." : "Signing In...") 
                  : (isSignUp ? "Create Customer Account" : "Sign In")
                }
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isSignUp ? "Already have a customer account?" : "Need to create a customer account?"}
              </p>
              <Button
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                className="p-0 h-auto text-pink-600 hover:text-pink-700"
              >
                {isSignUp ? "Sign in instead" : "Sign up instead"}
              </Button>
            </div>

            {isSignUp && (
              <div className="mt-6 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-pink-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-pink-800">
                    <p className="font-medium mb-1">Customer Benefits:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>View shop products and stock levels</li>
                      <li>Place orders and track delivery</li>
                      <li>View your spending history</li>
                      <li>Manage your debt and payments</li>
                      <li>Access loyalty rewards</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                <strong>🛍️ Customer Access:</strong> This portal is for shop customers who want to shop and track orders.
                <br />
                Shop owners and staff have separate portals.
              </p>
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
