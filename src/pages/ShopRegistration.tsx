import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Store, MapPin, Phone, Mail, FileText, Clock, Users, TrendingUp } from "lucide-react";

interface ShopRegistrationForm {
  shop_name: string;
  shop_description: string;
  business_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  contact_phone: string;
  contact_email: string;
  business_license_number: string;
  tax_id: string;
  business_type: string;
  expected_monthly_revenue: string;
  number_of_employees: string;
  business_hours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  services_offered: string[];
}

const ShopRegistration = () => {
  const [formData, setFormData] = useState<ShopRegistrationForm>({
    shop_name: "",
    shop_description: "",
    business_address: {
      street: "",
      city: "",
      state: "",
      postal_code: "",
              country: "Your Country"
    },
    contact_phone: "",
    contact_email: "",
    business_license_number: "",
    tax_id: "",
    business_type: "retail_shop",
    expected_monthly_revenue: "",
    number_of_employees: "",
    business_hours: {
      monday: { open: "09:00", close: "18:00", closed: false },
      tuesday: { open: "09:00", close: "18:00", closed: false },
      wednesday: { open: "09:00", close: "18:00", closed: false },
      thursday: { open: "09:00", close: "18:00", closed: false },
      friday: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "10:00", close: "16:00", closed: false },
      sunday: { open: "10:00", close: "16:00", closed: true }
    },
    services_offered: ["retail_products", "general_merchandise", "accessories"]
  });

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      // Get user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      // If user already has a shop, redirect to dashboard
      if (profileData?.shop_id) {
        navigate("/shop-owner-dashboard");
        return;
      }

      // If user already has a pending registration, show status
      if (profileData?.shop_registration_status === 'pending') {
        toast({
          title: "Registration Pending",
          description: "Your shop registration is under review. You'll be notified once it's approved."
        });
      }
    } catch (error) {
      console.error("Error checking user status:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof ShopRegistrationForm],
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

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      business_address: {
        ...prev.business_address,
        [field]: value
      }
    }));
  };

  const handleBusinessHoursChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day as keyof typeof prev.business_hours],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create shop registration request
      const { error } = await supabase
        .from("shop_registration_requests")
        .insert({
          user_id: user.id,
          shop_name: formData.shop_name,
          shop_description: formData.shop_description,
          business_address: formData.business_address,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email,
          business_license_number: formData.business_license_number || null,
          tax_id: formData.tax_id || null,
          business_type: formData.business_type,
          expected_monthly_revenue: formData.expected_monthly_revenue ? parseFloat(formData.expected_monthly_revenue) : null,
          number_of_employees: formData.number_of_employees ? parseInt(formData.number_of_employees) : null,
          business_hours: formData.business_hours,
          services_offered: formData.services_offered
        });

      if (error) throw error;

      // Update user profile status
      await supabase
        .from("profiles")
        .update({ shop_registration_status: 'pending' })
        .eq("id", user.id);

      toast({
        title: "Registration Submitted!",
        description: "Your shop registration has been submitted and is under review. You'll be notified once it's approved."
      });

      // Redirect to main dashboard (will show pending status)
              navigate("/shop-owner-dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Store className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold">Shop Registration</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Register your shop to start managing inventory and sales
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Business Information
            </CardTitle>
            <CardDescription>
              Provide details about your shop business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Shop Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop_name">Shop Name *</Label>
                  <Input
                    id="shop_name"
                    value={formData.shop_name}
                    onChange={(e) => handleInputChange("shop_name", e.target.value)}
                    placeholder="Enter shop name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_type">Business Type *</Label>
                  <Select
                    value={formData.business_type}
                    onValueChange={(value) => handleInputChange("business_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail_shop">Retail Shop</SelectItem>
                      <SelectItem value="tobacco_shop">Tobacco Shop</SelectItem>
                      <SelectItem value="convenience_store">Convenience Store</SelectItem>
                      <SelectItem value="online_retailer">Online Retailer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop_description">Shop Description</Label>
                <Textarea
                  id="shop_description"
                  value={formData.shop_description}
                  onChange={(e) => handleInputChange("shop_description", e.target.value)}
                  placeholder="Describe your shop, products, and services"
                  rows={3}
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone *</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                    placeholder="+264 XX XXX XXXX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange("contact_email", e.target.value)}
                    placeholder="shop@example.com"
                    required
                  />
                </div>
              </div>

              {/* Business Address */}
              <div className="space-y-4">
                <Label className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Business Address *
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={formData.business_address.street}
                      onChange={(e) => handleAddressChange("street", e.target.value)}
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.business_address.city}
                      onChange={(e) => handleAddressChange("city", e.target.value)}
                      placeholder="Windhoek"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.business_address.state}
                      onChange={(e) => handleAddressChange("state", e.target.value)}
                      placeholder="Khomas"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.business_address.postal_code}
                      onChange={(e) => handleAddressChange("postal_code", e.target.value)}
                      placeholder="0000"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expected_revenue">Expected Monthly Revenue (NAD)</Label>
                  <Input
                    id="expected_revenue"
                    type="number"
                    value={formData.expected_monthly_revenue}
                    onChange={(e) => handleInputChange("expected_monthly_revenue", e.target.value)}
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employees">Number of Employees</Label>
                  <Input
                    id="employees"
                    type="number"
                    value={formData.number_of_employees}
                    onChange={(e) => handleInputChange("number_of_employees", e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">Business License Number</Label>
                  <Input
                    id="license"
                    value={formData.business_license_number}
                    onChange={(e) => handleInputChange("business_license_number", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[200px]"
                >
                  {loading ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShopRegistration;
