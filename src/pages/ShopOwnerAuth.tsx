import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Store, 
  Eye, 
  EyeOff,
  LogIn,
  UserPlus,
  ArrowLeft,
  Building2,
  CheckCircle
} from "lucide-react";

const ShopOwnerAuth = () => {
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
    last_name: ""
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      // Try to get the user's profile
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, shop_id, shop_registration_status")
        .eq("id", data.user.id)
        .single();

      // If profile doesn't exist, create one
      if (profileError || !profile) {
        console.log("Profile not found, creating new profile...");
        
        // Get user metadata from auth
        const userMetadata = data.user.user_metadata;
        
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            first_name: userMetadata.first_name || '',
            last_name: userMetadata.last_name || '',
            role: userMetadata.role || 'shop_admin',
            shop_registration_status: null
          })
          .select("role, shop_id, shop_registration_status")
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          throw new Error("Failed to create user profile. Please contact support.");
        }

        profile = newProfile;
      }

      // Verify user is a shop owner
      if (profile?.role !== 'shop_admin') {
        await supabase.auth.signOut();
        throw new Error("Access denied. This portal is for shop owners only.");
      }

      // Check if shop registration is completed
      if (!profile.shop_id || profile.shop_registration_status !== 'completed') {
        // User needs to register their shop first
        toast({
          title: "Profile Created Successfully!",
          description: "Please register your shop details to continue."
        });
        
        // Navigate to shop registration or dashboard
        navigate("/dashboard");
        return;
      }

      toast({
        title: "Welcome back, Shop Owner!",
        description: "You have been successfully signed in to your shop dashboard."
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Sign in error:", error);
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

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: 'shop_admin'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Simple approach: just show success message
        // Profile will be created when user first signs in or when they register their shop
        console.log("User created successfully:", authData.user.id);

        toast({
          title: "Shop Owner Account Created!",
          description: "Please check your email to verify your account, then register your shop."
        });

        // Reset form
        setFormData({
          email: "",
          password: "",
          confirm_password: "",
          first_name: "",
          last_name: ""
        });

        // Switch to sign in
        setIsSignUp(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Store className="h-16 w-16 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">ShopBuddy</h1>
          <h2 className="text-2xl font-semibold text-blue-400 mb-2">Shop Owner Portal</h2>
          <p className="text-blue-100">
            {isSignUp ? "Create new shop owner account" : "Access your shop dashboard"}
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-gray-800">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span>{isSignUp ? "Create Shop Owner Account" : "Shop Owner Sign In"}</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isSignUp 
                ? "Set up your shop owner account to start managing your business" 
                : "Sign in to manage your shop operations"
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
                        className="border-gray-300 focus:border-blue-500"
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
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>
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
                  placeholder="owner@yourshop.com"
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
                      className="border-gray-300 focus:border-blue-500 pr-10"
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
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                size="lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  isSignUp ? <UserPlus className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />
                )}
                {loading 
                  ? (isSignUp ? "Creating Account..." : "Signing In...") 
                  : (isSignUp ? "Create Shop Owner Account" : "Sign In")
                }
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isSignUp ? "Already have a shop owner account?" : "Need to create a shop owner account?"}
              </p>
              <Button
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                className="p-0 h-auto text-blue-600 hover:text-blue-700"
              >
                {isSignUp ? "Sign in instead" : "Sign up instead"}
              </Button>
            </div>

            {isSignUp && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Next Steps After Sign Up:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Verify your email address</li>
                      <li>Register your shop details</li>
                      <li>Wait for ShopBuddy admin approval</li>
                      <li>Start managing your shop!</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                <strong>🏪 Shop Owner Access:</strong> This portal is for business owners who want to manage their shops.
                <br />
                Staff members and customers have separate portals.
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

export default ShopOwnerAuth;
