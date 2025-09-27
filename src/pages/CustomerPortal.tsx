import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Eye, CreditCard, Package, User, Bell, UserMinus, ShoppingCart, Plus, Minus, MapPin, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomerProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  total_spent?: number;
  order_count?: number;
  is_verified: boolean;
  shop_id?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  order_items?: Array<{
    quantity: number;
    unit_price: number;
    product_snapshot: any;
  }>;
}

interface DebtRecord {
  id: string;
  amount: number;
  description: string;
  due_date: string;
  status: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  is_active: boolean;
  categories?: {
    name: string;
  };
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

interface OrderRequest {
  items: CartItem[];
  payment_method: 'cash' | 'ewallet' | 'eft';
  pickup_notes?: string;
}

export default function CustomerPortal() {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [debtRecords, setDebtRecords] = useState<DebtRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderRequest, setOrderRequest] = useState<OrderRequest>({
    items: [],
    payment_method: 'cash',
    pickup_notes: ''
  });
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [signUpData, setSignUpData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCustomerData();
      loadProfileData();
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user || null);
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerData = async () => {
    if (!user) return;

    try {
      // Fetch customer profile
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("profile_id", user.id)
        .single();

      if (customerError) {
        console.error("Customer not found, creating one...");
        // Create customer profile if it doesn't exist
        const { data: newCustomer, error: createError } = await supabase
          .from("customers")
          .insert({
            profile_id: user.id,
            email: user.email || "",
            first_name: user.user_metadata?.first_name || "",
            last_name: user.user_metadata?.last_name || "",
            shop_id: "default" // This should be dynamically set based on the shop
          })
          .select()
          .single();

        if (createError) throw createError;
        setCustomer(newCustomer);
      } else {
        setCustomer(customerData);
      }

      // Fetch customer orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            product_snapshot
          )
        `)
        .eq("customer_id", customerData?.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch active products for browsing
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          *,
          categories!category_id (name)
        `)
        .eq("is_active", true)
        .order("name");

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Mock debt records for now
      setDebtRecords([
        {
          id: "1",
          amount: 150.00,
          description: "Purchase on credit - E-liquid bundle",
          due_date: "2024-01-15",
          status: "pending",
          created_at: "2024-01-01"
        },
        {
          id: "2",
          amount: 75.50,
                          description: "Product payment plan",
          due_date: "2024-01-20",
          status: "overdue",
          created_at: "2023-12-20"
        }
      ]);

    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customer data",
        variant: "destructive"
      });
    }
  };

  const signUp = async () => {
    try {
      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            first_name: signUpData.first_name,
            last_name: signUpData.last_name,
            phone: signUpData.phone,
            role: "customer"
          },
          emailRedirectTo: `${window.location.origin}/customer-portal`
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account created successfully! Please check your email to verify your account.",
      });

      setIsSignUpOpen(false);
      setSignUpData({ first_name: "", last_name: "", email: "", phone: "", password: "" });
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive"
      });
    }
  };

  const signIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Welcome back!",
      });

      setIsLoginOpen(false);
      setLoginData({ email: "", password: "" });
    } catch (error: any) {
      console.error("Error signing in:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive"
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Success",
        description: "Signed out successfully",
      });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  const loadProfileData = () => {
    if (user) {
      setProfileData({
        first_name: user.user_metadata?.first_name || customer?.first_name || "",
        last_name: user.user_metadata?.last_name || customer?.last_name || "",
        email: user.email || customer?.email || "",
        phone: user.user_metadata?.phone || customer?.phone || "",
        address: user.user_metadata?.address || ""
      });
    }
  };

  const updateProfile = async () => {
    try {
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          address: profileData.address
        }
      });

      if (authError) throw authError;

      // Update customer record
      if (customer?.id) {
        const { error: customerError } = await supabase
          .from("customers")
          .update({
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone
          })
          .eq("id", customer.id);

        if (customerError) throw customerError;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Refresh customer data
      await fetchCustomerData();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { id: product.id, product, quantity: 1 }];
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart`,
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const submitOrder = async () => {
    if (!customer?.id || cart.length === 0) return;

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;
      
      const orderData = {
        shop_id: customer.shop_id || "00000000-0000-0000-0000-000000000000",
        customer_id: customer.id,
        order_number: orderNumber,
        status: 'pending' as const,
        subtotal: getCartTotal(),
        total_amount: getCartTotal(),
        currency: 'NAD',
        notes: `Payment Method: ${orderRequest.payment_method.toUpperCase()}${orderRequest.pickup_notes ? `\nPickup Notes: ${orderRequest.pickup_notes}` : ''}`
      };

      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Add order items
      const orderItems = cart.map(item => ({
        order_id: newOrder.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        product_snapshot: {
          name: item.product.name,
          description: item.product.description,
          price: item.product.price
        }
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Order Submitted!",
        description: `Order ${orderNumber} has been placed for pickup. You'll be contacted when ready.`,
      });

      // Clear cart and close dialogs
      setCart([]);
      setIsOrderDialogOpen(false);
      setIsCartOpen(false);
      setOrderRequest({ items: [], payment_method: 'cash', pickup_notes: '' });

      // Refresh orders
      await fetchCustomerData();
    } catch (error: any) {
      console.error("Error submitting order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit order",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "paid": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">ShopBuddy</h1>

            <p className="text-xl text-muted-foreground">Customer Portal</p>
            <p className="text-muted-foreground">
              Sign up to track your orders, manage your account, and stay updated on our latest products and offers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-16">
                  <User className="w-5 h-5 mr-2" />
                  Create Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Your Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={signUpData.first_name}
                        onChange={(e) => setSignUpData({...signUpData, first_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={signUpData.last_name}
                        onChange={(e) => setSignUpData({...signUpData, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      value={signUpData.phone}
                      onChange={(e) => setSignUpData({...signUpData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsSignUpOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={signUp}>
                      Create Account
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="h-16">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Sign In
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sign In to Your Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="login_email">Email</Label>
                    <Input
                      id="login_email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="login_password">Password</Label>
                    <Input
                      id="login_password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsLoginOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={signIn}>
                      Sign In
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Available Products
              </CardTitle>
              <CardDescription>
                Browse our current product selection. Sign up to place orders and track your purchases.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {products.slice(0, 6).map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <h3 className="font-medium">{product.name}</h3>
                    {product.categories && (
                      <Badge variant="outline" className="mt-1">{product.categories.name}</Badge>
                    )}
                    <p className="text-lg font-bold text-primary mt-2">N${product.price.toFixed(2)}</p>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-1">{product.description.substring(0, 80)}...</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {customer?.first_name || "Customer"}</h1>
          <p className="text-muted-foreground mt-2">Manage your orders, account, and stay updated on products</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({cart.length})
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Shopping Cart</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.product.name}</h4>
                            <p className="text-sm text-muted-foreground">N${item.product.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between font-bold">
                        <span>Total: N${getCartTotal().toFixed(2)}</span>
                      </div>
                      <Button 
                        className="w-full mt-2" 
                        onClick={() => {
                          setOrderRequest({ ...orderRequest, items: cart });
                          setIsOrderDialogOpen(true);
                        }}
                      >
                        Place Order for Pickup
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="products">Browse Products</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="debt">Debt Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">N${(customer?.total_spent || 0).toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customer?.order_count || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Outstanding Debt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  N${debtRecords.filter(debt => debt.status === "pending" || debt.status === "overdue")
                    .reduce((sum, debt) => sum + debt.amount, 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.slice(0, 5).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.slice(0, 5).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.order_number}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.currency} {order.total_amount?.toFixed(2)}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>View all your past and current orders</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.order_number}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
                        </TableCell>
                        <TableCell>{order.currency} {order.total_amount?.toFixed(2)}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debt" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Debt Management</CardTitle>
              <CardDescription>Track your credit purchases and payment due dates</CardDescription>
            </CardHeader>
            <CardContent>
              {debtRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No debt records found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debtRecords.map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell>{debt.description}</TableCell>
                        <TableCell>N${debt.amount.toFixed(2)}</TableCell>
                        <TableCell>{new Date(debt.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(debt.status)}>
                            {debt.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(debt.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Products</CardTitle>
              <CardDescription>Browse our current product selection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <h3 className="font-medium">{product.name}</h3>
                    {product.categories && (
                      <Badge variant="outline" className="mt-1">{product.categories.name}</Badge>
                    )}
                    <p className="text-lg font-bold text-primary mt-2">N${product.price.toFixed(2)}</p>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-1">{product.description.substring(0, 100)}...</p>
                    )}
                    <Button 
                      className="w-full mt-3" 
                      onClick={() => addToCart(product)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Management</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profile_first_name">First Name</Label>
                  <Input
                    id="profile_first_name"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="profile_last_name">Last Name</Label>
                  <Input
                    id="profile_last_name"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="profile_email">Email</Label>
                <Input
                  id="profile_email"
                  type="email"
                  value={profileData.email}
                  disabled
                />
                <p className="text-sm text-muted-foreground mt-1">Email cannot be changed here</p>
              </div>
              <div>
                <Label htmlFor="profile_phone">Phone</Label>
                <Input
                  id="profile_phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="profile_address">Address</Label>
                <Textarea
                  id="profile_address"
                  value={profileData.address}
                  onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                  placeholder="Your pickup address..."
                />
              </div>
              <Button onClick={updateProfile}>
                <User className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={customer?.is_verified ? "default" : "secondary"}>
                  {customer?.is_verified ? "Verified" : "Unverified"}
                </Badge>
                {!customer?.is_verified && (
                  <p className="text-sm text-muted-foreground">
                    Contact the shop to verify your account for additional benefits
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.product.name} x{item.quantity}</span>
                    <span>N${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-1 font-bold flex justify-between">
                  <span>Total:</span>
                  <span>N${getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select value={orderRequest.payment_method} onValueChange={(value: 'cash' | 'ewallet' | 'eft') => 
                setOrderRequest({...orderRequest, payment_method: value})
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Cash on Pickup
                    </div>
                  </SelectItem>
                  <SelectItem value="ewallet">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      E-Wallet (FNB, Nedbank, etc.)
                    </div>
                  </SelectItem>
                  <SelectItem value="eft">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      EFT Bank Transfer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pickup_notes">Pickup Notes (Optional)</Label>
              <Textarea
                id="pickup_notes"
                value={orderRequest.pickup_notes}
                onChange={(e) => setOrderRequest({...orderRequest, pickup_notes: e.target.value})}
                placeholder="Any special instructions for pickup..."
              />
            </div>

            <div className="bg-muted p-3 rounded text-sm">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4" />
                <strong>Pickup Information</strong>
              </div>
              <p>• Orders are for pickup only</p>
              <p>• You'll be contacted when your order is ready</p>
              <p>• Payment will be processed on pickup</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={submitOrder} className="flex-1">
                <Package className="w-4 h-4 mr-2" />
                Place Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}