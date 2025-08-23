import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  DollarSign,
  CreditCard,
  AlertTriangle
} from "lucide-react";
import { HeaderWithNav } from "@/components/common/HeaderWithNav";
import { logAuditEvent } from "@/utils/auditLogger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  is_verified: boolean;
  total_spent: number;
  order_count: number;
  notes: string;
  created_at: string;
  debt_balance?: number;
}

interface DebtTransaction {
  id: string;
  customer_id: string;
  amount: number;
  type: 'credit' | 'payment';
  description: string;
  created_at: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    is_verified: false,
    notes: ""
  });
  const [debtFormData, setDebtFormData] = useState({
    amount: "",
    type: "credit" as "credit" | "payment",
    description: ""
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, shops(name)")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      if (profileData?.shop_id) {
        // Fetch customers
        const { data: customersData } = await supabase
          .from("customers")
          .select("*")
          .eq("shop_id", profileData.shop_id)
          .order("created_at", { ascending: false });

        // Calculate debt balances for each customer
        const customersWithDebt = await Promise.all(
          (customersData || []).map(async (customer) => {
            // Calculate debt balance from orders
        const { data: orders } = await supabase
          .from("orders")
          .select("total_amount, status")
          .eq("customer_id", customer.id)
          .eq("status", "pending");

            const debtBalance = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

            return {
              ...customer,
              debt_balance: debtBalance
            };
          })
        );

        setCustomers(customersWithDebt);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load customers"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out"
      });
    } else {
      navigate("/auth");
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      date_of_birth: "",
      is_verified: false,
      notes: ""
    });
    setEditingCustomer(null);
  };

  const resetDebtForm = () => {
    setDebtFormData({
      amount: "",
      type: "credit",
      description: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const customerData = {
        ...formData,
        shop_id: profile.shop_id,
        date_of_birth: formData.date_of_birth || null
      };

      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", editingCustomer.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Customer updated successfully"
        });
      } else {
        const { error } = await supabase
          .from("customers")
          .insert([customerData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Customer created successfully"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
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

  const handleDebtTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setLoading(true);

    try {
      const amount = parseFloat(debtFormData.amount);
      
      // Create a new order for credit or update existing debt
      if (debtFormData.type === "credit") {
        // Create a pending payment order for debt
        const { error } = await supabase
          .from("orders")
          .insert({
            shop_id: profile.shop_id,
            customer_id: selectedCustomer.id,
            order_number: `DEBT-${Date.now()}`,
            total_amount: amount,
            subtotal: amount,
            status: "pending",
            notes: debtFormData.description
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: `N$${amount.toFixed(2)} credit added to ${selectedCustomer.first_name}'s account`
        });
      } else {
        // Payment: find and update pending orders
        const { data: pendingOrders } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_id", selectedCustomer.id)
          .eq("status", "pending")
          .order("created_at", { ascending: true });

        let remainingPayment = amount;
        const updates = [];

        for (const order of pendingOrders || []) {
          if (remainingPayment <= 0) break;

          const orderAmount = Number(order.total_amount);
          if (remainingPayment >= orderAmount) {
            // Full payment for this order
            updates.push(
              supabase
                .from("orders")
                .update({ status: "delivered" })
                .eq("id", order.id)
            );
            remainingPayment -= orderAmount;
          } else {
            // Partial payment - update order amount
            updates.push(
              supabase
                .from("orders")
                .update({ total_amount: orderAmount - remainingPayment })
                .eq("id", order.id)
            );
            remainingPayment = 0;
          }
        }

        await Promise.all(updates);

        toast({
          title: "Success",
          description: `Payment of N$${amount.toFixed(2)} processed for ${selectedCustomer.first_name}`
        });
      }

      setIsDebtDialogOpen(false);
      resetDebtForm();
      fetchData();
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

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      first_name: customer.first_name || "",
      last_name: customer.last_name || "",
      email: customer.email,
      phone: customer.phone || "",
      date_of_birth: customer.date_of_birth || "",
      is_verified: customer.is_verified,
      notes: customer.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer deleted successfully"
      });
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const openDebtDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    resetDebtForm();
    setIsDebtDialogOpen(true);
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const customersWithDebt = filteredCustomers.filter(customer => (customer.debt_balance || 0) > 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthGuard requiredRole={['shop_admin', 'staff', 'super_admin']}>
      <div className="min-h-screen bg-background">
        <HeaderWithNav title="Customer Management" profile={profile} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Customer Management
              </h1>
              <p className="text-muted-foreground">
                Manage customers and track debt balances
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="premium" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingCustomer ? "Edit Customer" : "Add New Customer"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCustomer ? "Update customer information" : "Register a new customer"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        placeholder="First name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        placeholder="Last name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="customer@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="+264 81 123 4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Customer notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_verified"
                      checked={formData.is_verified}
                      onCheckedChange={(checked) => setFormData({...formData, is_verified: checked})}
                    />
                    <Label htmlFor="is_verified">Age Verified</Label>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : editingCustomer ? "Update Customer" : "Add Customer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers with Debt</CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{customersWithDebt.length}</div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Outstanding Debt</CardTitle>
                <DollarSign className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  N${customersWithDebt.reduce((sum, customer) => sum + (customer.debt_balance || 0), 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Customers</TabsTrigger>
              <TabsTrigger value="debt">With Debt</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {/* Search */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Customers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="shadow-card hover:shadow-primary transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {customer.first_name} {customer.last_name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {customer.email}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={customer.is_verified ? "default" : "secondary"}>
                            {customer.is_verified ? "Verified" : "Unverified"}
                          </Badge>
                          {(customer.debt_balance || 0) > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Debt: N${customer.debt_balance?.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {customer.phone && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Phone:</span>
                            <span className="text-sm">{customer.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Spent:</span>
                          <span className="font-semibold">N${customer.total_spent.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Orders:</span>
                          <span className="text-sm">{customer.order_count}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Member Since:</span>
                          <span className="text-sm">
                            {new Date(customer.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDebtDialog(customer)}
                          className="flex-1"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Debt
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="debt" className="space-y-6">
              {/* Debt Customers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customersWithDebt.map((customer) => (
                  <Card key={customer.id} className="shadow-card border-warning">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-warning">
                        {customer.first_name} {customer.last_name}
                      </CardTitle>
                      <CardDescription>{customer.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Outstanding Debt:</span>
                          <span className="font-bold text-destructive text-lg">
                            N${customer.debt_balance?.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Spent:</span>
                          <span className="text-sm">N${customer.total_spent.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDebtDialog(customer)}
                          className="flex-1"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Manage Debt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {customersWithDebt.length === 0 && (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No customers with debt</h3>
                  <p className="text-muted-foreground">All customers have cleared their outstanding balances!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Debt Management Dialog */}
          <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Debt Management</DialogTitle>
                <DialogDescription>
                  Manage debt for {selectedCustomer?.first_name} {selectedCustomer?.last_name}
                </DialogDescription>
              </DialogHeader>
              
              {selectedCustomer && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Debt Balance:</span>
                      <span className="text-lg font-bold text-destructive">
                        N${selectedCustomer.debt_balance?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleDebtTransaction} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="transaction_type">Transaction Type</Label>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={debtFormData.type === "credit" ? "default" : "outline"}
                          onClick={() => setDebtFormData({...debtFormData, type: "credit"})}
                          className="flex-1"
                        >
                          Add Credit (Increase Debt)
                        </Button>
                        <Button
                          type="button"
                          variant={debtFormData.type === "payment" ? "default" : "outline"}
                          onClick={() => setDebtFormData({...debtFormData, type: "payment"})}
                          className="flex-1"
                        >
                          Record Payment
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (N$)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={debtFormData.amount}
                        onChange={(e) => setDebtFormData({...debtFormData, amount: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="debt_description">Description</Label>
                      <Input
                        id="debt_description"
                        placeholder="Transaction description"
                        value={debtFormData.description}
                        onChange={(e) => setDebtFormData({...debtFormData, description: e.target.value})}
                        required
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDebtDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Processing..." : debtFormData.type === "credit" ? "Add Credit" : "Record Payment"}
                      </Button>
                    </DialogFooter>
                  </form>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Try adjusting your search"
                  : "Get started by registering your first customer"
                }
              </p>
              {!searchTerm && (
                <Button variant="premium" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Register Your First Customer
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default Customers;