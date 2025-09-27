import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Eye,
  Filter,
  ArrowLeft,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  User,
  ShoppingCart,
  DollarSign
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
}

const StaffCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [shopDetails, setShopDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: ""
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { shopId } = useParams();

  useEffect(() => {
    if (shopId) {
      fetchData();
    }
  }, [shopId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Get user profile and verify staff access
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .eq("shop_id", shopId)
        .single();

      if (profileError) throw profileError;

      // Verify user is staff of this shop
      if (profile.role !== 'staff' || profile.shop_id !== shopId) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You can only access your assigned shop."
        });
        navigate("/");
        return;
      }

      setUserProfile(profile);

      // Get shop details
      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .select("*")
        .eq("id", shopId)
        .single();

      if (shopError) throw shopError;
      setShopDetails(shop);

      // Fetch customers for this shop
      await fetchCustomers();

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load customers data."
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      // First get basic customer data
      const { data: customersData, error } = await supabase
        .from("customers")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get additional stats for each customer
      const customersWithStats = await Promise.all(
        (customersData || []).map(async (customer) => {
          // Get order count and total spent
          const { data: ordersData } = await supabase
            .from("orders")
            .select("total_amount, created_at")
            .eq("customer_id", customer.id)
            .eq("shop_id", shopId);

          const totalOrders = ordersData?.length || 0;
          const totalSpent = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
          const lastOrderDate = ordersData?.length > 0 
            ? Math.max(...ordersData.map(o => new Date(o.created_at).getTime()))
            : null;

          return {
            ...customer,
            total_orders: totalOrders,
            total_spent: totalSpent,
            last_order_date: lastOrderDate ? new Date(lastOrderDate).toISOString() : null
          };
        })
      );

      setCustomers(customersWithStats);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: ""
    });
    setEditingCustomer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const customerData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        shop_id: shopId
      };

      if (editingCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from("customers")
          .update({
            ...customerData,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingCustomer.id);

        if (error) throw error;

        toast({
          title: "Customer Updated",
          description: "Customer information has been updated successfully."
        });
      } else {
        // Create new customer
        const { error } = await supabase
          .from("customers")
          .insert([customerData]);

        if (error) throw error;

        toast({
          title: "Customer Created",
          description: "New customer has been added successfully."
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCustomers();
      
    } catch (error: any) {
      console.error("Error saving customer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save customer."
      });
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);

      if (error) throw error;

      toast({
        title: "Customer Deleted",
        description: "Customer has been removed successfully."
      });

      fetchCustomers();
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete customer."
      });
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => navigate(`/shop/${shopId}/staff-dashboard`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Users className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Customer Management</h1>
                <p className="text-blue-200 text-sm">{shopDetails?.name} - Staff Access</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={fetchCustomers}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-300"
            />
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">
                      {customer.first_name} {customer.last_name}
                    </CardTitle>
                    <CardDescription className="text-blue-200">
                      Customer since {new Date(customer.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-blue-300 border-blue-300">
                    {customer.total_orders || 0} orders
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-200">{customer.email}</span>
                </div>
                
                {customer.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-green-400" />
                    <span className="text-blue-200">{customer.phone}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-2 bg-white/5 rounded-lg">
                    <div className="text-white font-semibold">{customer.total_orders || 0}</div>
                    <div className="text-blue-200 text-xs">Total Orders</div>
                  </div>
                  
                  <div className="text-center p-2 bg-white/5 rounded-lg">
                    <div className="text-white font-semibold">N${(customer.total_spent || 0).toFixed(2)}</div>
                    <div className="text-blue-200 text-xs">Total Spent</div>
                  </div>
                </div>
                
                {customer.last_order_date && (
                  <div className="text-center p-2 bg-white/5 rounded-lg">
                    <div className="text-blue-200 text-xs">Last Order</div>
                    <div className="text-white text-sm">
                      {new Date(customer.last_order_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-blue-300 border-blue-300 hover:bg-blue-600 hover:text-white"
                    onClick={() => handleEdit(customer)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-300 border-red-300 hover:bg-red-600 hover:text-white"
                    onClick={() => handleDelete(customer.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No customers found</h3>
            <p className="text-blue-200">
              {searchTerm 
                ? "Try adjusting your search terms"
                : "Get started by adding your first customer"
              }
            </p>
          </div>
        )}
      </main>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer 
                ? "Update the customer information below"
                : "Fill in the details to create a new customer"
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="text-sm font-medium">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="Enter first name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="last_name" className="text-sm font-medium">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCustomer ? "Update Customer" : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffCustomers;
