import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus,
  X,
  ArrowLeft,
  RefreshCw,
  Package,
  User,
  DollarSign,
  Calculator,
  Receipt,
  Trash2,
  CheckCircle,
  Building2,
  LogOut,
  CreditCard,
  Users,
  Eye
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  sku: string;
  brand?: string;
  model?: string;
  images?: any;
  inventory?: {
    quantity: number;
    reorder_point: number | null;
  }[];
  categories?: { name: string };
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  customer_type?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

interface UnifiedPOSProps {
  userRole: 'shop_admin' | 'staff';
  shopId: string;
}

const UnifiedPOS: React.FC<UnifiedPOSProps> = ({ userRole, shopId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [shopDetails, setShopDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();

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
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .eq("shop_id", shopId)
        .single();

      if (profileError || !profile) {
        throw new Error("Profile not found");
      }

      if (profile.role !== userRole) {
        throw new Error("Access denied. Insufficient permissions.");
      }

      // Get shop details
      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .select("id, name, description, logo_url")
        .eq("id", shopId)
        .single();

      if (shopError || !shop) {
        throw new Error("Shop not found");
      }

      // Fetch products, customers, and categories
      const [productsRes, customersRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select(`
            *,
            inventory (
              quantity,
              reorder_point
            ),
            categories!category_id (
              name
            )
          `)
          .eq("shop_id", shopId)
          .eq("is_active", true)
          .order("name", { ascending: true }),
        supabase
          .from("customers")
          .select("*")
          .eq("shop_id", shopId)
          .order("first_name", { ascending: true }),
        supabase
          .from("categories")
          .select("id, name")
          .eq("shop_id", shopId)
          .eq("is_active", true)
          .order("name", { ascending: true })
      ]);

      if (productsRes.error) {
        console.error("Error fetching products:", productsRes.error);
      } else {
        setProducts(productsRes.data || []);
      }

      if (customersRes.error) {
        console.error("Error fetching customers:", customersRes.error);
      } else {
        setCustomers(customersRes.data || []);
      }

      if (categoriesRes.error) {
        console.error("Error fetching categories:", categoriesRes.error);
      } else {
        setCategories(categoriesRes.data || []);
      }

      setShopDetails(shop);
      setUserProfile(profile);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load data"
      });
      navigate("/customer-auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out"
      });
      navigate("/customer-auth");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * product.price }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, total: product.price }]);
    }
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to cart`
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.product.price }
        : item
    ));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const getTax = () => {
    return getTotal() * 0.08; // 8% tax
  };

  const getGrandTotal = () => {
    return getTotal() + getTax();
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cart is empty"
      });
      return;
    }

    if (!selectedCustomer) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a customer"
      });
      return;
    }

    try {
      const orderData = {
        shop_id: shopId,
        customer_id: selectedCustomer.id,
        staff_id: userProfile.id,
        total_amount: getTotal(),
        tax_amount: getTax(),
        grand_total: getGrandTotal(),
        payment_method: paymentMethod,
        status: 'completed',
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.total
        }))
      };

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.total
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      // Update inventory
      for (const item of cart) {
        const { error: inventoryError } = await supabase
          .from('inventory')
          .update({ 
            quantity: item.product.inventory?.[0]?.quantity - item.quantity || 0 
          })
          .eq('product_id', item.product.id)
          .eq('shop_id', shopId);

        if (inventoryError) {
          console.error("Error updating inventory:", inventoryError);
        }
      }

      setCurrentOrder(order);
      setShowReceipt(true);
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod('cash');
      setCashAmount('');

      toast({
        title: "Order completed!",
        description: `Order #${order.id} has been processed successfully`
      });

    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process payment"
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           product.categories?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading POS system...</p>
        </div>
      </div>
    );
  }

  if (!shopDetails || !userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md border-b border-white/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">{shopDetails.name}</h1>
                <p className="text-sm font-medium text-blue-100 bg-blue-900/30 px-3 py-1 rounded-full">
                  {userRole === 'shop_admin' ? 'Shop Owner POS' : 'Staff POS'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <p className="text-xs text-blue-200 uppercase tracking-wide">Welcome,</p>
                <p className="text-sm font-semibold text-white">
                  {userProfile.first_name} {userProfile.last_name}
                </p>
                <p className="text-xs text-blue-200 capitalize">{userProfile.role}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate(`/shop/${shopId}/${userRole === 'shop_admin' ? 'shop-owner-dashboard' : 'staff-dashboard'}`)}
                className="text-white hover:text-blue-200 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-blue-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="text-white hover:text-blue-200 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-blue-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-white font-bold text-xl flex items-center">
                  <Search className="h-5 w-5 mr-2 text-blue-300" />
                  Products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-300 focus:border-blue-300 focus:bg-white/20"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const stockQuantity = product.inventory?.[0]?.quantity || 0;
                const stockStatus = stockQuantity === 0 ? 'Out of Stock' : 
                                   stockQuantity <= 5 ? 'Low Stock' : 'In Stock';
                const stockColor = stockQuantity === 0 ? 'bg-red-500' : 
                                  stockQuantity <= 5 ? 'bg-yellow-500' : 'bg-green-500';

                return (
                  <Card 
                    key={product.id} 
                    className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl hover:from-white/30 hover:to-white/20 transition-all duration-300 cursor-pointer group"
                    onClick={() => stockQuantity > 0 && addToCart(product)}
                  >
                    <CardHeader className="pb-3">
                      <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden bg-white/10">
                                                                          {(() => {
                           // Handle different image field formats
                           let imageUrl = null;
                           
                           // Check if images field exists and has content
                           if (product.images) {
                             if (Array.isArray(product.images) && product.images.length > 0) {
                               imageUrl = product.images[0];
                             } else if (typeof product.images === 'object' && product.images !== null) {
                               // Handle case where images might be a JSON object
                               const imageKeys = Object.keys(product.images);
                               if (imageKeys.length > 0) {
                                 imageUrl = product.images[imageKeys[0]];
                               }
                             }
                           }
                           
                           // Check if image_url field exists (fallback for older schema)
                           if (!imageUrl && (product as any).image_url) {
                             imageUrl = (product as any).image_url;
                           }
                           
                           if (imageUrl) {
                             return (
                               <img 
                                 src={imageUrl} 
                                 alt={product.name}
                                 className="w-full h-full object-cover"
                                 onError={(e) => {
                                   // Fallback to placeholder if image fails to load
                                   const target = e.target as HTMLImageElement;
                                   target.style.display = 'none';
                                   target.nextElementSibling?.classList.remove('hidden');
                                 }}
                               />
                             );
                           }
                           
                           return null;
                         })()}
                         <div className={`w-full h-full flex flex-col items-center justify-center ${(() => {
                           // Check if any image source exists
                           if (product.images) {
                             if (Array.isArray(product.images) && product.images.length > 0) return false;
                             if (typeof product.images === 'object' && product.images !== null) {
                               const imageKeys = Object.keys(product.images);
                               if (imageKeys.length > 0) return false;
                             }
                           }
                           if ((product as any).image_url) return false;
                           return true;
                         })() ? '' : 'hidden'}`}>
                           <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full flex items-center justify-center mb-1">
                             <Package className="h-5 w-5 text-blue-300" />
                           </div>
                           <p className="text-xs text-blue-200 text-center">No Image</p>
                         </div>
                        <Badge className={`absolute top-2 right-2 ${stockColor} text-white`}>
                          {stockStatus}
                        </Badge>
                      </div>
                      <CardTitle className="text-white font-bold text-sm line-clamp-2">
                        {product.name}
                      </CardTitle>
                      <div className="text-blue-200 text-xs">
                        SKU: {product.sku}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-lg font-bold text-white">
                        N${product.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-blue-200">
                        Stock: {stockQuantity}
                      </div>
                      {product.categories?.name && (
                        <Badge variant="outline" className="border-blue-300 text-blue-200 text-xs">
                          {product.categories.name}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
                <p className="text-blue-200">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'No products are currently available'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Right Panel - Cart */}
          <div className="space-y-6">
            {/* Customer Selection */}
            <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-white font-bold text-lg flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-300" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedCustomer ? (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">
                          {selectedCustomer.first_name} {selectedCustomer.last_name}
                        </p>
                        <p className="text-blue-200 text-sm">{selectedCustomer.email}</p>
                        {selectedCustomer.phone && (
                          <p className="text-blue-200 text-sm">{selectedCustomer.phone}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedCustomer(null)}
                        className="text-red-300 hover:text-red-200 hover:bg-red-900/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowCustomerSelect(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Select Customer
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Cart */}
            <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-white font-bold text-lg flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-blue-300" />
                  Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.length === 0 ? (
                  <p className="text-blue-200 text-center py-4">Add products to get started</p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">{item.product.name}</p>
                            <p className="text-blue-200 text-xs">N${item.product.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="text-blue-300 hover:text-blue-200 hover:bg-blue-900/20"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-white font-medium min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="text-blue-300 hover:text-blue-200 hover:bg-blue-900/20"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-red-300 hover:text-red-200 hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cart Totals */}
                    <div className="border-t border-white/20 pt-3 space-y-2">
                      <div className="flex justify-between text-blue-200">
                        <span>Subtotal:</span>
                        <span>N${getTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-blue-200">
                        <span>Tax (8%):</span>
                        <span>N${getTax().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-white font-bold text-lg">
                        <span>Total:</span>
                        <span>N${getGrandTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label className="text-blue-200 text-sm">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Process Payment Button */}
                    <Button
                      onClick={processPayment}
                      disabled={!selectedCustomer || cart.length === 0}
                      className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Process Payment
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Customer Selection Dialog */}
      <Dialog open={showCustomerSelect} onOpenChange={setShowCustomerSelect}>
        <DialogContent className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30">
          <DialogHeader>
            <DialogTitle className="text-white">Select Customer</DialogTitle>
            <DialogDescription className="text-blue-200">
              Choose a customer for this transaction
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => {
                  setSelectedCustomer(customer);
                  setShowCustomerSelect(false);
                }}
              >
                <div>
                  <p className="text-white font-medium">
                    {customer.first_name} {customer.last_name}
                  </p>
                  <p className="text-blue-200 text-sm">{customer.email}</p>
                  {customer.phone && (
                    <p className="text-blue-200 text-sm">{customer.phone}</p>
                  )}
                </div>
                <Button size="sm" variant="ghost" className="text-blue-300 hover:text-blue-200">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30">
          <DialogHeader>
            <DialogTitle className="text-white">Order Receipt</DialogTitle>
            <DialogDescription className="text-blue-200">
              Order completed successfully!
            </DialogDescription>
          </DialogHeader>
          {currentOrder && (
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="text-center mb-4">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-white">Order #{currentOrder.id}</h3>
                  <p className="text-blue-200">{new Date().toLocaleString()}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-blue-200">
                    <span>Subtotal:</span>
                    <span>N${currentOrder.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-blue-200">
                    <span>Tax:</span>
                    <span>N${currentOrder.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-lg border-t border-white/20 pt-2">
                    <span>Total:</span>
                    <span>N${currentOrder.grand_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setShowReceipt(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedPOS;
