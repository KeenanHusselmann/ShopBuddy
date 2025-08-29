import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  UserPlus, 
  Store, 
  Mail, 
  Lock, 
  Phone, 
  MapPin,
  Calendar,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { HeaderWithNav } from "@/components/common/HeaderWithNav";

interface ShopInfo {
  id: string;
  name: string;
  description: string;
  business_type: string;
}

const CustomerSignup = () => {
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get('shop_id');
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingUp, setSigningUp] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      postal_code: "",
              country: "Your Country"
    },
    date_of_birth: ""
  });

  useEffect(() => {
    if (shopId) {
      fetchShopInfo();
    } else {
      setLoading(false);
    }
  }, [shopId]);

  const fetchShopInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, description, business_type")
        .eq("id", shopId)
        .single();

      if (error) throw error;
      setShop(data);
    } catch (error) {
      console.error("Error fetching shop info:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load shop information"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningUp(true);

    // Validation
    if (formData.password !== formData.confirm_password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match"
      });
      setSigningUp(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters long"
      });
      setSigningUp(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('create_customer_account', {
        shop_id_param: shopId,
        email_param: formData.email,
        password_param: formData.password,
        first_name_param: formData.first_name,
        last_name_param: formData.last_name,
        phone_param: formData.phone || null,
        address_param: formData.address
      });

      if (error) throw error;

      if (data.success) {
        setSignupSuccess(true);
        toast({
          title: "Success!",
          description: "Your customer account has been created successfully. You can now log in to view products and place orders."
        });
      } else {
        throw new Error(data.error || "Failed to create account");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setSigningUp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!shopId || !shop) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Invalid Shop</h1>
            <p className="text-muted-foreground mb-6">
              The shop you're trying to access doesn't exist or the link is invalid.
            </p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Welcome to {shop.name}!</h1>
            <p className="text-muted-foreground mb-6">
              Your customer account has been created successfully. You can now:
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 max-w-md mx-auto">
              <ul className="text-left text-sm text-green-700 space-y-2">
                <li>• View shop products and stock levels</li>
                <li>• Place orders and track delivery</li>
                <li>• View your spending history</li>
                <li>• Manage your debt and payments</li>
                <li>• Access loyalty rewards</li>
              </ul>
            </div>
            <div className="space-x-4">
              <Button onClick={() => navigate(`/customer-portal?shop_id=${shopId}`)}>
                Go to Customer Portal
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userProfile = {
    first_name: "Guest",
    last_name: "",
    email: "",
    role: "guest",
    avatar_url: null
  };

  return (
    <div className="min-h-screen bg-background py-8">
      {/* Header */}
      <HeaderWithNav 
        title="ShopBuddy" 
        user={userProfile}
      />
        <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          
          <div className="flex items-center justify-center mb-4">
            <Store className="h-16 w-16 text-primary" />
          </div>
          
                      <h1 className="text-4xl font-bold mb-4">Join {shop.name}</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Create your customer account to access products, place orders, and track your spending
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-700">
              <strong>Shop Type:</strong> {shop.business_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
            {shop.description && (
              <p className="text-sm text-blue-700 mt-1">
                {shop.description}
              </p>
            )}
          </div>
        </div>

        {/* Signup Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Create Customer Account</span>
            </CardTitle>
            <CardDescription>
              Fill in your details to create your customer account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+264 XX XXX XXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange("address.street", e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange("address.city", e.target.value)}
                      placeholder="Windhoek"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Region</Label>
                    <Input
                      id="state"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange("address.state", e.target.value)}
                      placeholder="Khomas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.address.postal_code}
                      onChange={(e) => handleInputChange("address.postal_code", e.target.value)}
                      placeholder="0000"
                    />
                  </div>
                </div>
              </div>

              {/* Account Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Security</h3>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Create a strong password"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password *</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) => handleInputChange("confirm_password", e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={signingUp}
                className="w-full"
                size="lg"
              >
                {signingUp ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {signingUp ? "Creating Account..." : "Create Customer Account"}
              </Button>

              {/* Terms and Privacy */}
              <p className="text-xs text-muted-foreground text-center">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
                Your information will be used to provide you with the best shopping experience.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerSignup;
