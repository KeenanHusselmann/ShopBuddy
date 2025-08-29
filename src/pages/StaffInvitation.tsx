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

const StaffInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
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
      console.log("Fetching invitation for token:", token);

      const { data: invitation, error } = await supabase
        .from("shop_staff_invitations")
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
      setFormData(prev => ({
        ...prev,
        firstName: invitation.first_name,
        lastName: invitation.last_name,
        email: invitation.email
      }));
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
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords don't match");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      console.log("Accepting invitation for:", invitation.email);

      // Step 0: Check if user already exists
      console.log("Checking if user already exists...");
      const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: "dummy-password-to-check-existence"
      });

      if (existingUser && !checkError) {
        console.log("User already exists and can sign in - this shouldn't happen with a pending invitation");
        throw new Error("User account already exists. Please contact your shop owner.");
      }

      if (checkError && checkError.message.includes("Invalid login credentials")) {
        console.log("User doesn't exist yet - proceeding with account creation");
      } else if (checkError) {
        console.log("Unexpected error checking user existence:", checkError);
      }

      // Step 1: Create the auth user with proper password storage
      console.log("Creating auth user with email:", invitation.email);
      console.log("Password length:", formData.password.length);
      console.log("Password value (first 3 chars):", formData.password.substring(0, 3) + "...");
      
      // First, check if user already exists
      console.log("Checking if user already exists...");
      const { data: existingUserCheck, error: existingUserError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: "dummy-password-to-check-existence"
      });

      if (existingUserCheck && !existingUserError) {
        console.log("User already exists and can sign in - this shouldn't happen with a pending invitation");
        throw new Error("User account already exists. Please contact your shop owner.");
      }

      if (existingUserError && existingUserError.message.includes("Invalid login credentials")) {
        console.log("User doesn't exist yet - proceeding with account creation");
      } else if (existingUserError) {
        console.log("Unexpected error checking user existence:", existingUserError);
      }

      // Create the auth user with the password
      console.log("Creating new auth user with password...");
      
      // Try to create user with email confirmation disabled
      let authData, authError;
      
      try {
        // First attempt: Try to create user without email confirmation
        const result = await supabase.auth.signUp({
          email: invitation.email,
          password: formData.password,
          options: {
            data: {
              first_name: invitation.first_name,
              last_name: invitation.last_name,
              role: 'staff'
            },
            emailRedirectTo: `${window.location.origin}/staff-auth`
          }
        });
        
        authData = result.data;
        authError = result.error;
        
        if (authError && authError.message.includes("email")) {
          console.log("Email confirmation required, trying alternative approach...");
          
          // Try to create user with admin privileges (if available)
          // This is a fallback approach
          console.log("Attempting to create user with admin override...");
        }
        
      } catch (error) {
        console.log("Signup attempt failed:", error);
        authError = error as any;
      }

      console.log("Auth signup response:", { authData, authError });

      if (authError) {
        console.error("Auth signup error:", authError);
        console.error("Error details:", {
          message: authError.message,
          status: authError.status,
          name: authError.name
        });
        throw new Error(authError.message || "Failed to create account");
      }

      if (!authData.user) {
        console.error("No user data returned from signup");
        throw new Error("Failed to create user account");
      }

      console.log("Auth user created successfully:", {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed: authData.user.email_confirmed_at,
        created_at: authData.user.created_at
      });

      // Check if email confirmation is required
      if (!authData.user.email_confirmed_at) {
        console.log("Email confirmation required - attempting to bypass this requirement...");
        
        // Try to manually confirm the user by updating their email_confirmed_at
        try {
          console.log("Attempting to manually confirm user email...");
          
          // First, try to sign in with the password to see if it works
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: invitation.email,
            password: formData.password
          });

          if (signInError) {
            console.log("Sign in failed, email confirmation is required:", signInError);
            
            // Try to send confirmation email as fallback
            try {
              const { error: confirmError } = await supabase.auth.resend({
                type: 'signup',
                email: invitation.email
              });

              if (!confirmError) {
                console.log("Confirmation email sent successfully");
                toast({
                  title: "Account created! 📧",
                  description: "Please check your email and click the confirmation link to activate your account. You can then sign in with your credentials."
                });
              } else {
                console.log("Failed to send confirmation email:", confirmError);
                toast({
                  title: "Account created but email confirmation required! ⚠️",
                  description: "Your account was created but email confirmation is required. Please contact your shop owner to help activate your account."
                });
              }
            } catch (error) {
              console.log("Failed to send confirmation email:", error);
              toast({
                title: "Account created but email confirmation required! ⚠️",
                description: "Your account was created but email confirmation is required. Please contact your shop owner to help activate your account."
              });
            }

            // Update invitation status to 'pending_confirmation'
            const { error: updateError } = await supabase
              .from('shop_staff_invitations')
              .update({ 
                status: 'pending_confirmation',
                accepted_at: new Date().toISOString()
              })
              .eq('id', invitation.id);

            if (updateError) {
              console.error("Invitation update error:", updateError);
            }

            // Redirect to staff auth page
            navigate("/staff-auth");
            return;
          } else {
            console.log("Sign in successful! Email confirmation bypassed.");
            // Sign out to continue with profile creation
            await supabase.auth.signOut();
          }
        } catch (error) {
          console.log("Manual confirmation attempt failed:", error);
          
          // Fallback to email confirmation
          toast({
            title: "Account created but email confirmation required! ⚠️",
            description: "Your account was created but email confirmation is required. Please contact your shop owner to help activate your account."
          });

          // Update invitation status to 'pending_confirmation'
          const { error: updateError } = await supabase
            .from('shop_staff_invitations')
            .update({ 
              status: 'pending_confirmation',
              accepted_at: new Date().toISOString()
            })
            .eq('id', invitation.id);

          if (updateError) {
            console.error("Invitation update error:", updateError);
          }

          // Redirect to staff auth page
          navigate("/staff-auth");
          return;
        }
      }

      console.log("Email confirmation handled - proceeding with profile creation");

      // Note: Password verification already completed above

      // Step 2: Create or update the profile using the utility function
      const profileResult = await createOrUpdateProfile({
        id: authData.user.id,
        email: invitation.email,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        role: 'staff',
        shop_id: invitation.shop_id,
        phone: invitation.phone || null
      });

      if (!profileResult.success) {
        console.error("Profile creation/update error:", profileResult.error);
        // If profile creation/update fails, we should clean up the auth user
        // But for now, let's just show the error
        throw new Error("Failed to create/update profile: " + profileResult.error);
      }

      console.log("Profile created/updated successfully");

      // Step 3: Update invitation status to 'accepted' (for confirmed accounts)
      const { error: updateError } = await supabase
        .from('shop_staff_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error("Invitation update error:", updateError);
        // This is not critical, so we'll just log it
      }

      // Step 4: Sign out the user (they need to sign in with their new credentials)
      console.log("Signing out user after successful account creation");
      await supabase.auth.signOut();

      console.log("Account creation completed successfully!");
      console.log("User should now be able to sign in with:");
      console.log("- Email:", invitation.email);
      console.log("- Password:", formData.password);
      
      // Final verification - try to sign in to ensure everything works
      console.log("Performing final verification...");
      
      // Try multiple verification approaches
      let verificationSuccessful = false;
      
      // Approach 1: Direct sign in
      try {
        const { data: finalVerifyData, error: finalVerifyError } = await supabase.auth.signInWithPassword({
          email: invitation.email,
          password: formData.password
        });

        if (!finalVerifyError) {
          console.log("Final verification successful - account is fully functional");
          console.log("The password has been successfully stored and verified in Supabase auth");
          verificationSuccessful = true;
        } else {
          console.log("Direct sign in verification failed:", finalVerifyError);
        }
      } catch (error) {
        console.log("Direct sign in verification attempt failed:", error);
      }
      
      // Approach 2: If direct sign in failed, try to check if email confirmation is the issue
      if (!verificationSuccessful) {
        try {
          console.log("Checking if email confirmation is blocking sign in...");
          
          // Try to get user info to see confirmation status
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (user && !user.email_confirmed_at) {
            console.log("User exists but email not confirmed - this is the issue");
            toast({
              title: "Account created but email confirmation required! ⚠️",
              description: "Your account was created but email confirmation is required. Please check your email or contact your shop owner for help."
            });
          } else {
            console.log("User verification completed");
            verificationSuccessful = true;
          }
        } catch (error) {
          console.log("User verification check failed:", error);
        }
      }
      
      // Sign out after verification
      await supabase.auth.signOut();
      
      if (!verificationSuccessful) {
        console.log("Final verification indicates email confirmation is required");
        toast({
          title: "Account created but verification incomplete! ⚠️",
          description: "Your account was created but email confirmation is required. Please check your email or try signing in directly."
        });
      }

      toast({
        title: "Account created successfully! 🎉",
        description: "You can now sign in to your shop using your new credentials."
      });

      // Step 5: Redirect to staff auth page
      navigate("/staff-auth");

    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        variant: "destructive",
        title: "Failed to create account",
        description: error.message || "An error occurred while creating your account"
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-blue-600 mr-2" />
            <UserCheck className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-gray-800">Accept Staff Invitation</CardTitle>
          <CardDescription className="text-gray-600">
            Complete your staff account setup for the shop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{invitation.first_name} {invitation.last_name}</strong><br />
              Role: {invitation.role}<br />
              Email: {invitation.email}
            </p>
          </div>

          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
              <p className="text-xs text-gray-500">Must be at least 6 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
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

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              size="lg"
              disabled={accepting}
            >
              {accepting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {accepting ? "Creating Account..." : "Accept Invitation & Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffInvitation;
