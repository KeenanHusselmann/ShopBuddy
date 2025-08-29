import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Users, 
  Eye, 
  EyeOff,
  LogIn,
  ArrowLeft,
  UserCheck,
  AlertCircle,
  Building2,
  Loader2
} from "lucide-react";
import { activityTracker } from '../utils/activityTracker';

const StaffAuth = () => {
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

  // Add activity tracking state
  const [isTrackingLogin, setIsTrackingLogin] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsTrackingLogin(true);

    try {
      if (!formData.shopName.trim()) {
        throw new Error("Please enter the shop name you work for");
      }

      console.log("Attempting sign in for:", formData.email, "at shop:", formData.shopName);
      
      // First, let's check if the user exists and get their profile
      console.log("Checking if user exists...");
      console.log("Attempting sign in with email:", formData.email);
      console.log("Password length:", formData.password.length);
      console.log("Password value (first 3 chars):", formData.password.substring(0, 3) + "...");
      
      const { data: existingUser, error: userCheckError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      console.log("Sign in response:", { existingUser, userCheckError });

      if (userCheckError) {
        console.error("Auth error:", userCheckError);
        console.error("Error details:", {
          message: userCheckError.message,
          status: userCheckError.status,
          name: userCheckError.name
        });
        
        // Check if it's a password issue
        if (userCheckError.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please check your credentials or use the password reset option below.");
        }
        
        // Check if email confirmation is required
        if (userCheckError.message.includes("Email not confirmed")) {
          throw new Error("Please check your email and click the confirmation link to activate your account before signing in.");
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

      if (userProfile?.role !== 'staff') {
        await supabase.auth.signOut();
        throw new Error("Access denied. This portal is for shop staff members only.");
      }

      // Now find the shop by name
      console.log("Searching for shop:", formData.shopName);
      const { data: shops, error: shopError } = await supabase
        .from("shops")
        .select("id, name")
        .ilike("name", `%${formData.shopName.trim()}%`);

      if (shopError) {
        console.error("Shop search error:", shopError);
        await supabase.auth.signOut();
        throw new Error("Failed to search for shops. Please try again.");
      }

      if (!shops || shops.length === 0) {
        await supabase.auth.signOut();
        throw new Error(`No shops found matching "${formData.shopName}". Please check the shop name and try again.`);
      }

      console.log("Shops found:", shops);

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

      console.log("Selected shop:", shop);

      // Verify user is actually a staff member of this specific shop
      console.log("Profile shop_id:", userProfile.shop_id, "Found shop id:", shop.id, "Shop name:", shop.name);
      
      if (userProfile.shop_id !== shop.id) {
        console.log("Shop ID mismatch! User profile has shop_id:", userProfile.shop_id, "but found shop has id:", shop.id);
        console.log("This suggests the invitation was created for a different shop than the one being accessed");
        await supabase.auth.signOut();
        throw new Error(`Access denied. You were invited to a different shop (ID: ${userProfile.shop_id}) than the one you're trying to access (ID: ${shop.id}). Please contact your shop owner.`);
      }

      toast({
        title: `Welcome back, ${userProfile.first_name}! 🎉`,
        description: `You have been successfully signed in to ${shop.name}.`
      });

      // Track login activity
      try {
        await activityTracker.trackLogin(
          shop.id,
          existingUser.user.id,
          '127.0.0.1', // In production, you'd get this from your backend
          navigator.userAgent
        );
      } catch (trackingError) {
        console.warn('Failed to track login activity:', trackingError);
        // Don't block login if tracking fails
      }

      // Navigate to shop-specific staff dashboard
      navigate(`/shop/${shop.id}/staff-dashboard`);
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
      setIsTrackingLogin(false);
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
      
      // First, check if the user exists
      console.log("Checking if user exists before password reset...");
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.log("Cannot check user existence (admin access required), proceeding with reset...");
      } else {
        const userExists = users?.some(user => user.email === formData.email);
        if (!userExists) {
          toast({
            variant: "destructive",
            title: "User not found",
            description: "No user found with this email address. Please check the email or contact your shop owner."
          });
          return;
        }
      }
      
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
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-16 w-16 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Staff Portal</h1>
          <h2 className="text-2xl font-semibold text-green-400 mb-2">Shop Access</h2>
          <p className="text-green-100">
            Access your shop dashboard to help manage operations
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-gray-800">
              <UserCheck className="h-6 w-6 text-green-600" />
              <span>Staff Member Sign In</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign in with your staff credentials and specify your shop
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
                    className="border-gray-300 focus:border-green-500 pl-10"
                  />
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">Enter the exact name of the shop you work for</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="staff@yourshop.com"
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
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
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
                                 <div className="space-y-2">
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
                   
                   <Button
                     type="button"
                     variant="outline"
                     onClick={async () => {
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
                         const { error } = await supabase.auth.resend({
                           type: 'signup',
                           email: formData.email
                         });
                         
                         if (error) {
                           throw error;
                         }
                         
                         toast({
                           title: "Confirmation email sent! 📧",
                           description: "Check your email for a new confirmation link. Also check your spam folder."
                         });
                       } catch (error: any) {
                         console.error("Resend error:", error);
                         toast({
                           variant: "destructive",
                           title: "Failed to send confirmation",
                           description: error.message || "Could not send confirmation email"
                         });
                       } finally {
                         setLoading(false);
                       }
                     }}
                     disabled={loading || !formData.email.trim()}
                     className="w-full text-sm"
                     size="sm"
                   >
                     📧 Resend Confirmation
                   </Button>
                 </div>
                 <p className="text-xs text-gray-500 text-center mt-2">
                   Use these options if you're having trouble accessing your account
                 </p>
              </div>
            </form>

                         <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
               <div className="flex items-start space-x-2">
                 <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                 <div className="text-sm text-green-800">
                   <p className="font-medium mb-1">Staff Access Information:</p>
                   <ul className="list-disc list-inside space-y-1 text-xs">
                     <li>You must be invited by your shop owner</li>
                     <li>Enter the exact name of your shop</li>
                     <li>Use the email address you were invited with</li>
                     <li>Contact your shop owner if you need access</li>
                     <li>This portal is for staff members only</li>
                   </ul>
                 </div>
               </div>
             </div>

             {/* Email Confirmation Help */}
             <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
               <div className="text-sm text-blue-800">
                 <p className="font-medium mb-1">📧 Email Confirmation Help:</p>
                 <ul className="list-disc list-inside space-y-1 text-xs">
                   <li>If you just created your account, check your email for a confirmation link</li>
                   <li>If you didn't receive the email, try signing in directly</li>
                   <li>Use the password reset option if you can't sign in</li>
                   <li>Check your spam/junk folder for confirmation emails</li>
                 </ul>
               </div>
             </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                <strong>👥 Staff Access:</strong> This portal is for shop staff members who have been invited by their shop owners.
                <br />
                Shop owners and customers have separate portals.
              </p>
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

export default StaffAuth;
