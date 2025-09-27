import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  UserCheck,
  Building2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { createOrUpdateProfile } from "@/utils/profile";

const ShopCustomerInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    phone: ""
  });
  const [error, setError] = useState<string | null>(null);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      console.log("Fetching customer invitation for token:", token);

      const { data: invitation, error } = await supabase
        .from("shop_customer_invitations")
        .select("*")
        .eq("invitation_token", token)
        .eq("status", "pending")
        .single();

      if (error) {
        console.error("Error fetching invitation:", error);
        setError("Invalid or expired invitation. Please contact your shop owner for a new invitation.");
        return;
      }

      if (!invitation) {
        setError("Invitation not found or already used.");
        return;
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        setError("This invitation has expired. Please contact your shop owner for a new invitation.");
        return;
      }

      setInvitation(invitation);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to load invitation. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccepting(true);

    try {
      if (!invitation) {
        throw new Error("No invitation found");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      console.log("Creating customer account for:", invitation.email);

      // Step 1: Create the auth user with proper password storage
      console.log("Creating auth user with email:", invitation.email);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            first_name: invitation.first_name,
            last_name: invitation.last_name,
            role: 'customer',
            shop_id: invitation.shop_id
          }
        }
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      console.log("Auth user created:", authData.user.id);

      // Step 2: Create or update the profile using the utility function (same as staff)
      const profileResult = await createOrUpdateProfile({
        id: authData.user.id,
        email: invitation.email,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        role: 'customer',
        shop_id: invitation.shop_id,
        phone: formData.phone || null,
        customer_type: invitation.customer_type || 'regular'
      });

      if (!profileResult.success) {
        console.error("Profile creation/update error:", profileResult.error);
        throw new Error("Failed to create/update profile: " + profileResult.error);
      }

      console.log("Customer profile created successfully");

      // Step 3: Create customer record in customers table
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          id: authData.user.id,
          shop_id: invitation.shop_id,
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          email: invitation.email,
          phone: formData.phone || null,
          customer_type: invitation.customer_type || 'regular',
          date_of_birth: invitation.date_of_birth || null,
          age_verified: invitation.age_verified || false
        });

      if (customerError) {
        console.error("Customer record creation error:", customerError);
        // Don't fail the entire process if this fails
        console.log("Customer record creation failed, but profile was created");
      }

      // Step 4: Update invitation status to 'accepted'
      const { error: updateError } = await supabase
        .from("shop_customer_invitations")
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: authData.user.id
        })
        .eq("id", invitation.id);

      if (updateError) {
        console.error("Failed to update invitation status:", updateError);
        // Don't fail the entire process if this update fails
      }

      // Step 5: Sign out the user (they need to sign in with their new credentials)
      console.log("Signing out user after successful account creation");
      await supabase.auth.signOut();

      toast({
        title: "Welcome to the shop! 🎉",
        description: "Your customer account has been created successfully. You can now sign in."
      });

      // Wait a moment before redirecting to customer portal
      setTimeout(() => {
        navigate(`/customer-auth`);
      }, 2000);

    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      
      let errorMessage = "Failed to create account";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error_description) {
        errorMessage = error.error_description;
      }

      setError(errorMessage);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-900 via-rose-900 to-red-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-900 via-rose-900 to-red-900 p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">Invitation Error</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-900 to-red-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
            <UserCheck className="h-8 w-8 text-pink-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to the Shop!
          </CardTitle>
          <CardDescription className="text-gray-600">
            You've been invited to join as a customer. Please set your password to complete your account setup.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 rounded-lg bg-pink-50 p-4">
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-pink-600" />
              <div>
                <p className="font-medium text-pink-900">
                  {invitation.first_name} {invitation.last_name}
                </p>
                <p className="text-sm text-pink-700">{invitation.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAcceptInvitation} className="space-y-4">
                         <div className="space-y-2">
               <Label htmlFor="phone" className="text-gray-900 font-semibold text-sm">Phone Number (Optional)</Label>
               <Input
                 id="phone"
                 type="tel"
                 placeholder="Enter your phone number"
                 value={formData.phone}
                 onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                 className="w-full border-2 border-gray-600 bg-gray-100 text-gray-900 placeholder-gray-500 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-200"
               />
             </div>

             <div className="space-y-2">
               <Label htmlFor="password" className="text-gray-900 font-semibold text-sm">Password</Label>
               <div className="relative">
                 <Input
                   id="password"
                   type={showPassword ? "text" : "password"}
                   placeholder="Enter your password"
                   value={formData.password}
                   onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                   className="w-full border-2 border-gray-600 bg-gray-100 text-gray-900 placeholder-gray-500 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-200 pr-10"
                   required
                 />
                 <Button
                   type="button"
                   variant="ghost"
                   size="sm"
                   className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                   onClick={() => setShowPassword(!showPassword)}
                 >
                   {showPassword ? (
                     <EyeOff className="h-4 w-4 text-gray-600" />
                   ) : (
                     <Eye className="h-4 w-4 text-gray-600" />
                   )}
                 </Button>
               </div>
             </div>

             <div className="space-y-2">
               <Label htmlFor="confirmPassword" className="text-gray-900 font-semibold text-sm">Confirm Password</Label>
               <div className="relative">
                 <Input
                   id="confirmPassword"
                   type={showConfirmPassword ? "text" : "password"}
                   placeholder="Confirm your password"
                   value={formData.confirmPassword}
                   onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                   className="w-full border-2 border-gray-600 bg-gray-100 text-gray-900 placeholder-gray-500 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-200 pr-10"
                   required
                 />
                 <Button
                   type="button"
                   variant="ghost"
                   size="sm"
                   className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                 >
                   {showConfirmPassword ? (
                     <EyeOff className="h-4 w-4 text-gray-600" />
                   ) : (
                     <Eye className="h-4 w-4 text-gray-600" />
                   )}
                 </Button>
               </div>
             </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
              disabled={accepting}
            >
              {accepting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopCustomerInvitation;
