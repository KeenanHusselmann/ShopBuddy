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
  Building2,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Calendar,
  DollarSign,
  ShoppingBag,
  CreditCard
} from 'lucide-react';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  tax_amount: number;
  grand_total: number;
  status: string;
  payment_method: string;
  archived: boolean;
  archived_at?: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
}

const CustomerOrders: React.FC = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [customerRecord, setCustomerRecord] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (shopId) {
      fetchData();
      
      // Set up real-time subscription for order updates
      const channel = supabase
        .channel('customer-orders-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `shop_id=eq.${shopId}`
          },
          (payload) => {
            console.log('Order update received:', payload);
            // Refresh data when orders are updated
            fetchData();
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
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
      let customerRecord = null;
      
      // Try different possible table structures
      try {
        // First, try to find by profile_id (if the table has that structure)
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

      if (!customerRecord) {
        throw new Error("Customer record not found");
      }

      console.log("Found customer record:", customerRecord);

      // Get customer orders with items and products using the correct customer_id
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items (
            id,
            quantity,
            unit_price,
            total_price,
            product:products (
              id,
              name,
              price,
              image_url
            )
          )
        `)
        .eq("shop_id", shopId)
        .eq("customer_id", customerRecord.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load orders"
        });
      } else {
        console.log("Fetched orders data:", ordersData);
        setOrders(ordersData || []);
      }

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

  const handleArchiveOrder = async (orderId: string) => {
    try {
      console.log("Attempting to archive order:", orderId);
      console.log("Current user ID:", (await supabase.auth.getUser()).data.user?.id);
      console.log("Customer record:", customerRecord);
      
      const { data, error } = await supabase
        .from("orders")
        .update({ 
          archived: true,
          archived_at: new Date().toISOString()
        })
        .eq("id", orderId)
        .select();

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }

      console.log("Archive successful, updated data:", data);

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, archived: true, archived_at: new Date().toISOString() }
          : order
      ));

      toast({
        title: "Order archived",
        description: "Order has been moved to archived orders"
      });
    } catch (error: any) {
      console.error("Error archiving order:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to archive order: ${error.message || 'Unknown error'}`
      });
    }
  };

  const handleUnarchiveOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          archived: false,
          archived_at: null
        })
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, archived: false, archived_at: null }
          : order
      ));

      toast({
        title: "Order restored",
        description: "Order has been restored from archived orders"
      });
    } catch (error: any) {
      console.error("Error restoring order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to restore order"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'processing':
        return <Truck className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-900 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!shop || !customerProfile) {
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
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">{shop.name}</h1>
                <p className="text-sm font-medium text-pink-100 bg-pink-900/30 px-3 py-1 rounded-full">My Orders</p>
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
                onClick={() => navigate(`/shop/${shopId}/customer-dashboard`)}
                className="text-white hover:text-pink-200 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-pink-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
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
        {/* Header Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-xl mr-6">
                  <ShoppingBag className="h-16 w-16 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl text-white font-bold drop-shadow-lg mb-2">
                    My Order History
                  </CardTitle>
                  <CardDescription className="text-xl text-pink-100 font-medium">
                    Track your purchases and order status
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                 <p className="text-white mb-4 text-xl font-semibold">
                   Hello <span className="text-pink-200 font-bold">{customerProfile.first_name}</span>! 
                   You have <span className="text-pink-200 font-bold">
                     {orders.filter(order => !order.archived).length}
                   </span> active order{orders.filter(order => !order.archived).length !== 1 ? 's' : ''} 
                   and <span className="text-pink-200 font-bold">
                     {orders.filter(order => order.archived).length}
                   </span> archived order{orders.filter(order => order.archived).length !== 1 ? 's' : ''} in your history.
                 </p>
                                 <p className="text-pink-100 italic text-lg">
                   All your orders from {shop.name} are displayed below
                 </p>
                 <div className="mt-4">
                   <Button
                     variant="outline"
                     onClick={() => setShowArchived(!showArchived)}
                     className={`border-pink-300 text-pink-200 hover:bg-pink-300 hover:text-white ${
                       showArchived ? 'bg-pink-300 text-white' : ''
                     }`}
                   >
                     {showArchived ? 'Hide Archived' : 'Show Archived'} Orders
                   </Button>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

                 {/* Orders List */}
         {orders.filter(order => showArchived ? order.archived : !order.archived).length === 0 ? (
           <div className="text-center py-12">
             <ShoppingBag className="h-16 w-16 text-white/40 mx-auto mb-4" />
             <h3 className="text-xl font-semibold text-white mb-2">
               {showArchived ? 'No archived orders' : 'No orders yet'}
             </h3>
             <p className="text-pink-200 mb-6">
               {showArchived 
                 ? 'You haven\'t archived any orders yet.'
                 : 'Start shopping to see your orders here!'
               }
             </p>
             {!showArchived && (
               <Button
                 onClick={() => navigate(`/shop/${shopId}/customer-products`)}
                 className="bg-pink-600 hover:bg-pink-700 text-white"
               >
                 <Package className="h-4 w-4 mr-2" />
                 Browse Products
               </Button>
             )}
           </div>
         ) : (
           <div className="space-y-6">
             {orders.filter(order => showArchived ? order.archived : !order.archived).map((order) => (
              <Card key={order.id} className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                                         <div className="flex items-center space-x-4">
                       <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg">
                         <Package className="h-5 w-5 text-white" />
                       </div>
                       <div>
                         <CardTitle className="text-white font-bold">
                           Order #{order.id.slice(0, 8).toUpperCase()}
                           {order.archived && (
                             <Badge className="ml-2 bg-gray-500 text-white text-xs">
                               Archived
                             </Badge>
                           )}
                         </CardTitle>
                         <CardDescription className="text-pink-200">
                           <Calendar className="h-4 w-4 inline mr-2" />
                           {formatDate(order.created_at)}
                           {order.archived_at && (
                             <span className="ml-2 text-orange-200">
                               • Archived {formatDate(order.archived_at)}
                             </span>
                           )}
                         </CardDescription>
                       </div>
                     </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={`${getStatusColor(order.status)} text-white flex items-center space-x-2`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </Badge>
                                             <div className="flex items-center space-x-2">
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => {
                             setSelectedOrder(order);
                             setShowOrderDetails(true);
                           }}
                           className="border-pink-300 text-pink-200 hover:bg-pink-300 hover:text-white"
                         >
                           <Eye className="h-4 w-4 mr-2" />
                           View Details
                         </Button>
                         {!order.archived ? (
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleArchiveOrder(order.id)}
                             className="border-orange-300 text-orange-200 hover:bg-orange-300 hover:text-white"
                           >
                             Archive
                           </Button>
                         ) : (
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleUnarchiveOrder(order.id)}
                             className="border-green-300 text-green-200 hover:bg-green-300 hover:text-white"
                           >
                             Restore
                           </Button>
                         )}
                       </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="flex items-center space-x-2 text-pink-200 mb-1">
                        <Package className="h-4 w-4" />
                        <span className="text-sm font-medium">Items</span>
                      </div>
                      <p className="text-white font-bold">{order.items?.length || 0} items</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="flex items-center space-x-2 text-pink-200 mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm font-medium">Total</span>
                      </div>
                      <p className="text-white font-bold">N${(order.total_amount || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="flex items-center space-x-2 text-pink-200 mb-1">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm font-medium">Payment</span>
                      </div>
                      <p className="text-white font-bold capitalize">{order.payment_method}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 ${showOrderDetails ? 'block' : 'hidden'}`}>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowOrderDetails(false)}
                    className="text-pink-200 hover:text-pink-100 hover:bg-pink-900/20"
                  >
                    <XCircle className="h-6 w-6" />
                  </Button>
                </div>

                {/* Order Summary */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Order Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-pink-200">Date:</span>
                      <p className="text-white font-medium">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <span className="text-pink-200">Status:</span>
                      <Badge className={`${getStatusColor(selectedOrder.status)} text-white ml-2`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1 capitalize">{selectedOrder.status}</span>
                      </Badge>
                    </div>
                    <div>
                      <span className="text-pink-200">Payment Method:</span>
                      <p className="text-white font-medium capitalize">{selectedOrder.payment_method}</p>
                    </div>
                                         <div>
                       <span className="text-pink-200">Total Items:</span>
                       <p className="text-white font-medium">{selectedOrder.items?.length || 0}</p>
                     </div>
                     <div>
                       <span className="text-pink-200">Archive Status:</span>
                       <div className="text-white font-medium">
                         {selectedOrder.archived ? (
                           <Badge className="bg-gray-500 text-white text-xs">
                             Archived on {formatDate(selectedOrder.archived_at || '')}
                           </Badge>
                         ) : (
                           <Badge className="bg-green-500 text-white text-xs">
                             Active
                           </Badge>
                         )}
                       </div>
                     </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-white">Order Items</h3>
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                          {item.product.image_url ? (
                            <img 
                              src={item.product.image_url} 
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-white/40" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{item.product.name}</h4>
                          <p className="text-pink-200 text-sm">
                            Quantity: {item.quantity} × N${item.unit_price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">N${item.total_price.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-3">Order Totals</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-pink-200">
                      <span>Subtotal:</span>
                      <span>N${selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-pink-200">
                      <span>Tax:</span>
                      <span>N${selectedOrder.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-lg border-t border-white/20 pt-2">
                      <span>Grand Total:</span>
                      <span>N${(selectedOrder.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
