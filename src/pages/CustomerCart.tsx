import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Building2,
  LogOut,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    sku: string;
    brand: string;
    model: string;
    image_url?: string;
    images?: any;
  };
}

const CustomerCart: React.FC = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [customerRecord, setCustomerRecord] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

      // Get shop details
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("id, name, description, logo_url")
        .eq("id", shopId)
        .single();

      if (shopError || !shopData) {
        throw new Error("Shop not found");
      }

      // Get customer profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .eq("shop_id", shopId)
        .single();

      if (profileError || !profile) {
        throw new Error("Customer profile not found");
      }

      if (profile.role !== 'customer') {
        throw new Error("Access denied. This portal is for customers only.");
      }

      // Get customer record from customers table
      // Try different possible table structures
      let customerRecord = null;
      let customerError = null;

      // First, try to find by profile_id (if the table has that structure)
      try {
        const { data: customerByProfile, error: error1 } = await supabase
          .from("customers")
          .select("id")
          .eq("profile_id", user.id)
          .eq("shop_id", shopId)
          .single();
        
        if (customerByProfile && !error1) {
          customerRecord = customerByProfile;
        }
      } catch (e) {
        // Ignore this error, try next approach
      }

      // If not found, try to find by id (if the table uses id as foreign key to profiles)
      if (!customerRecord) {
        try {
          const { data: customerById, error: error2 } = await supabase
            .from("customers")
            .select("id")
            .eq("id", user.id)
            .eq("shop_id", shopId)
            .single();
          
          if (customerById && !error2) {
            customerRecord = customerById;
          }
        } catch (e) {
          // Ignore this error, try next approach
        }
      }

      // If still not found, try to find by email (most common fallback)
      if (!customerRecord) {
        try {
          const { data: customerByEmail, error: error3 } = await supabase
            .from("customers")
            .select("id")
            .eq("email", user.email)
            .eq("shop_id", shopId)
            .single();
          
          if (customerByEmail && !error3) {
            customerRecord = customerByEmail;
          }
        } catch (e) {
          // Ignore this error
        }
      }

      // If still not found, create a customer record
      if (!customerRecord) {
        try {
          const { data: newCustomer, error: createError } = await supabase
            .from("customers")
            .insert({
              id: user.id, // Use user.id as the customer id
              shop_id: shopId,
              first_name: profile.first_name || 'Customer',
              last_name: profile.last_name || 'User',
              email: user.email || profile.email,
              phone: profile.phone,
              customer_type: 'retail'
            })
            .select("id")
            .single();
          
          if (newCustomer && !createError) {
            customerRecord = newCustomer;
          } else {
            throw new Error("Failed to create customer record");
          }
        } catch (createError) {
          console.error("Error creating customer record:", createError);
          throw new Error("Customer record not found and could not be created");
        }
      }

      // Get cart items
      console.log("Fetching cart for customer:", customerRecord.id, "shop:", shopId);
      
      const { data: cartData, error: cartError } = await supabase
        .from("customer_cart")
        .select(`
          id,
          product_id,
          quantity,
          product:products (
            id,
            name,
            description,
            price,
            sku,
            brand,
            model,
            image_url,
            images
          )
        `)
        .eq("customer_id", customerRecord.id)
        .eq("shop_id", shopId);

      if (cartError) {
        console.error("Error fetching cart:", cartError);
      } else {
        setCartItems(cartData || []);
      }

      console.log("Found customer record:", customerRecord);
      setShop(shopData);
      setCustomerProfile(profile);
      setCustomerRecord(customerRecord);
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
        description: "You have been signed out of your customer account"
      });
      navigate("/customer-auth");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item from cart
      await removeFromCart(cartItemId);
      return;
    }

    try {
      const { error } = await supabase
        .from("customer_cart")
        .update({ quantity: newQuantity })
        .eq("id", cartItemId);

      if (error) {
        throw error;
      }

      // Update local state
      setCartItems(prev => prev.map(item => 
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      ));

      toast({
        title: "Cart updated",
        description: "Item quantity updated successfully"
      });
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update quantity"
      });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from("customer_cart")
        .delete()
        .eq("id", cartItemId);

      if (error) {
        throw error;
      }

      // Update local state
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));

      toast({
        title: "Item removed",
        description: "Item removed from cart successfully"
      });
    } catch (error: any) {
      console.error("Error removing item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove item"
      });
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.08; // 8% tax
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Cart",
        description: "Your cart is empty"
      });
      return;
    }

    try {
      setCheckoutLoading(true);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          shop_id: shopId,
          order_number: generateOrderNumber(),
          customer_id: customerRecord.id,
          subtotal: getSubtotal(),
          tax_amount: getTax(),
          total_amount: getTotal(),
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        product_snapshot: {
          name: item.product.name,
          description: item.product.description,
          sku: item.product.sku,
          brand: item.product.brand,
          model: item.product.model,
          price: item.product.price
        }
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      // Clear cart
      const { error: clearCartError } = await supabase
        .from("customer_cart")
        .delete()
        .eq("customer_id", customerRecord.id)
        .eq("shop_id", shopId);

      if (clearCartError) {
        console.error("Error clearing cart:", clearCartError);
      }

      // Update local state
      setCartItems([]);

      toast({
        title: "Order placed successfully!",
        description: `Order #${order.id} has been submitted. Shop owner will review and contact you.`
      });

      // Navigate to order confirmation or back to products
      navigate(`/shop/${shopId}/customer-orders`);

    } catch (error: any) {
      console.error("Error during checkout:", error);
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: error.message || "Failed to process checkout"
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getImageUrl = (product: any) => {
    if (product.image_url) return product.image_url;
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-900 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (!shop || !customerProfile || !customerRecord) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-900 to-red-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md border-b border-white/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">{shop.name}</h1>
                <p className="text-sm font-medium text-pink-100 bg-pink-900/30 px-3 py-1 rounded-full">Shopping Cart</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <p className="text-xs text-pink-200 uppercase tracking-wide">Welcome back,</p>
                <p className="text-sm font-semibold text-white">
                  {customerProfile.first_name} {customerProfile.last_name}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate(`/shop/${shopId}/customer-products`)}
                className="text-white hover:text-pink-200 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-pink-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="text-white hover:text-pink-200 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-pink-300"
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
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
            <p className="text-pink-200 mb-6">Start shopping to add items to your cart</p>
            <Button
              onClick={() => navigate(`/shop/${shopId}/customer-products`)}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white font-bold text-xl flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-pink-300" />
                    Cart Items ({cartItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                      {/* Product Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                        {getImageUrl(item.product) ? (
                          <img 
                            src={getImageUrl(item.product)} 
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-pink-300" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg truncate">{item.product.name}</h3>
                        <p className="text-pink-200 text-sm truncate">{item.product.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {item.product.brand && (
                            <Badge variant="outline" className="border-pink-300 text-pink-200 text-xs">
                              {item.product.brand}
                            </Badge>
                          )}
                          <span className="text-pink-200 text-sm">SKU: {item.product.sku}</span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-pink-300 hover:text-pink-200 hover:bg-pink-900/20"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-white font-medium min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-pink-300 hover:text-pink-200 hover:bg-pink-900/20"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Price and Remove */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">
                          N${(item.product.price * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-pink-200 text-sm">
                          N${item.product.price.toFixed(2)} each
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-300 hover:text-red-200 hover:bg-red-900/20 mt-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white font-bold text-lg flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-pink-300" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-pink-200">
                      <span>Subtotal ({cartItems.length} items):</span>
                      <span>N${getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-pink-200">
                      <span>Tax (8%):</span>
                      <span>N${getTax().toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/20 pt-3">
                      <div className="flex justify-between text-white font-bold text-xl">
                        <span>Total:</span>
                        <span>N${getTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || cartItems.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed h-12 text-lg"
                  >
                    {checkoutLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5" />
                        <span>Checkout</span>
                      </div>
                    )}
                  </Button>

                  {/* Info */}
                  <div className="bg-blue-900/20 border border-blue-300/30 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-300 mt-0.5 flex-shrink-0" />
                      <div className="text-blue-200 text-sm">
                        <p className="font-medium">How it works:</p>
                        <p>1. Place your order</p>
                        <p>2. Shop owner reviews and contacts you</p>
                        <p>3. Arrange payment and delivery</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerCart;
