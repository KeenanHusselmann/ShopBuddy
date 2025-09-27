import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  ArrowLeft,
  ShoppingCart,
  Building2,
  LogOut,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Phone,
  Mail,
  User,
  DollarSign,
  Calendar,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  tax_amount: number;
  grand_total: number;
  payment_method: string;
  status: string;
  order_type: string;
  created_at: string;
  updated_at: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  items: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product: {
      id: string;
      name: string;
      sku: string;
      image_url?: string;
      images?: any;
    };
  }[];
}

const ShopOwnerOrders: React.FC = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;
  
  // Delete confirmation state
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);

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

      if (profile.role !== 'shop_admin') {
        throw new Error("Access denied. This portal is for shop owners only.");
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

      // Get orders with customer and item details
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers (
            first_name,
            last_name,
            email,
            phone
          ),
          items:order_items (
            id,
            quantity,
            unit_price,
            total_price,
            product:products (
              id,
              name,
              sku,
              image_url,
              images
            )
          )
        `)
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
      } else {
        console.log("Fetched shop owner orders data:", ordersData);
        setOrders(ordersData || []);
      }

      setShop(shopData);
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus, updated_at: new Date().toISOString() } : order
      ));

      toast({
        title: "Order updated",
        description: `Order status updated to ${newStatus}`
      });
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status"
      });
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      // First delete order items
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("Error deleting order items:", itemsError);
        throw new Error("Failed to delete order items");
      }

      // Then delete the order
      const { error: orderError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (orderError) {
        throw orderError;
      }

      // Update local state
      setOrders(prev => prev.filter(order => order.id !== orderId));

      // Reset to first page if current page becomes empty
      const totalPages = Math.ceil((filteredOrders.length - 1) / ordersPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }

      toast({
        title: "Order deleted",
        description: "Order has been permanently deleted"
      });
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete order"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'processing': return 'bg-purple-500';
      case 'shipped': return 'bg-indigo-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <RefreshCw className="h-4 w-4" />;
      case 'shipped': return <Package className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getImageUrl = (product: any) => {
    if (product.image_url) return product.image_url;
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return null;
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesType = orderTypeFilter === 'all' || order.order_type === orderTypeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, orderTypeFilter]);

  const getPendingOrdersCount = () => {
    return orders.filter(order => order.status === 'pending').length;
  };

  /**
   * Calculate total revenue from orders
   * Priority: completed orders (confirmed, processing, shipped, delivered, completed)
   * Fallback: all non-cancelled orders if no completed orders exist
   */
  const getTotalRevenue = () => {
    // First try to get revenue from completed orders
    const revenueOrders = orders.filter(order => ['confirmed', 'processing', 'shipped', 'delivered', 'completed'].includes(order.status));
    
    // Try both total_amount and grand_total fields
    let totalRevenue = revenueOrders.reduce((sum, order) => {
      const amount = order.total_amount || order.grand_total || 0;
      return sum + amount;
    }, 0);
    
    // If no revenue from completed orders, try all orders (excluding cancelled)
    if (totalRevenue === 0) {
      const allValidOrders = orders.filter(order => order.status !== 'cancelled' && order.status !== 'refunded');
      totalRevenue = allValidOrders.reduce((sum, order) => {
        const amount = order.total_amount || order.grand_total || 0;
        return sum + amount;
      }, 0);
      console.log('Using fallback revenue calculation (all non-cancelled orders):', totalRevenue);
    }
    
    // Debug logging
    console.log('Revenue calculation:', {
      totalOrders: orders.length,
      revenueOrders: revenueOrders.length,
      revenueOrderStatuses: revenueOrders.map(o => ({ 
        id: o.id, 
        status: o.status, 
        total_amount: o.total_amount,
        grand_total: o.grand_total
      })),
      totalRevenue
    });
    
    // Log all available order statuses for debugging
    const allStatuses = [...new Set(orders.map(o => o.status))];
    console.log('All available order statuses:', allStatuses);
    
    // Check for orders with null/undefined amounts
    const ordersWithNullAmount = orders.filter(o => 
      (o.total_amount === null || o.total_amount === undefined) && 
      (o.grand_total === null || o.grand_total === undefined)
    );
    if (ordersWithNullAmount.length > 0) {
      console.warn('Orders with null/undefined amounts:', ordersWithNullAmount.map(o => ({ 
        id: o.id, 
        status: o.status, 
        total_amount: o.total_amount,
        grand_total: o.grand_total
      })));
    }
    
    // Show revenue breakdown by status
    const revenueByStatus = {};
    revenueOrders.forEach(order => {
      const status = order.status;
      const amount = order.total_amount || order.grand_total || 0;
      revenueByStatus[status] = (revenueByStatus[status] || 0) + amount;
    });
    console.log('Revenue breakdown by status:', revenueByStatus);
    
    return totalRevenue;
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const goToPage = (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const renderPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="text-blue-200 border-blue-300 hover:bg-blue-600 hover:text-white disabled:opacity-50"
        >
          Previous
        </Button>
        
        {renderPageNumbers().map((page, index) => (
          <Button
            key={index}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => typeof page === 'number' && goToPage(page)}
            disabled={page === '...'}
            className={
              page === currentPage
                ? "bg-blue-600 text-white"
                : "text-blue-200 border-blue-300 hover:bg-blue-600 hover:text-white"
            }
          >
            {page}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="text-blue-200 border-blue-300 hover:bg-blue-600 hover:text-white disabled:opacity-50"
        >
          Next
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!shop || !userProfile) {
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
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">{shop.name}</h1>
                <p className="text-sm font-medium text-blue-100 bg-blue-900/30 px-3 py-1 rounded-full">Order Management</p>
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
                size="sm"
                onClick={() => {
                  console.log('Manual refresh triggered');
                  fetchData();
                }}
                className="text-blue-200 hover:text-blue-100 hover:bg-white/20 px-3 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-blue-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate(`/shop/${shopId}/shop-owner-dashboard`)}
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Pending Orders</p>
                  <p className="text-2xl font-bold text-white">{getPendingOrdersCount()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <ShoppingCart className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <DollarSign className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">N${getTotalRevenue().toFixed(2)}</p>
                  <p className="text-xs text-blue-300 mt-1">
                    From completed & active orders
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-white font-bold text-xl flex items-center">
              <Filter className="h-5 w-5 mr-2 text-blue-300" />
              Search & Filter Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by customer name, email, or order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-300 focus:border-blue-300 focus:bg-white/20"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="All Order Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Order Types</SelectItem>
                  <SelectItem value="customer_online">Customer Online</SelectItem>
                  <SelectItem value="pos">POS Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>

                         <div className="text-blue-200 text-sm">
               Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders (Page {currentPage} of {totalPages})
             </div>
          </CardContent>
        </Card>

                 {/* Orders List */}
         <div className="space-y-6">
           {currentOrders.length === 0 ? (
             <div className="text-center py-12">
               <ShoppingCart className="h-16 w-16 text-white/40 mx-auto mb-4" />
               <h3 className="text-xl font-semibold text-white mb-2">No orders found</h3>
               <p className="text-blue-200">
                 {searchTerm || statusFilter !== 'all' || orderTypeFilter !== 'all'
                   ? 'Try adjusting your search or filters'
                   : 'No orders have been placed yet'
                 }
               </p>
             </div>
           ) : (
             currentOrders.map((order) => (
              <Card key={order.id} className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusColor(order.status)} text-white flex items-center space-x-1`}>
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </Badge>
                        {order.order_type === 'customer_online' && (
                          <Badge variant="outline" className="border-green-300 text-green-200">
                            Online Order
                          </Badge>
                        )}
                      </div>
                      <div className="text-blue-200 text-sm">
                        Order #{order.id.slice(0, 8)}...
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        N${(order.total_amount || 0).toFixed(2)}
                      </div>
                      <div className="text-blue-200 text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Customer Information */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <User className="h-6 w-6 text-blue-300" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">
                          {order.customer?.first_name} {order.customer?.last_name}
                        </h4>
                        <div className="flex items-center space-x-4 text-blue-200 text-sm">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{order.customer?.email}</span>
                          </div>
                          {order.customer?.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-4 w-4" />
                              <span>{order.customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-blue-200 text-sm">
                        <div>Subtotal: N${order.total_amount.toFixed(2)}</div>
                        <div>Tax: N${order.tax_amount.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <h5 className="text-white font-semibold flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      Order Items ({order.items.length})
                    </h5>
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                          {getImageUrl(item.product) ? (
                            <img 
                              src={getImageUrl(item.product)} 
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-blue-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h6 className="text-white font-medium">{item.product.name}</h6>
                          <p className="text-blue-200 text-sm">SKU: {item.product.sku}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">
                            {item.quantity} × N${item.unit_price.toFixed(2)}
                          </div>
                          <div className="text-blue-200 text-sm">
                            Total: N${item.total_price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                                     {/* Action Buttons */}
                   <div className="flex items-center justify-between pt-4 border-t border-white/20">
                     <div className="text-blue-200 text-sm">
                       <div className="flex items-center space-x-2">
                         <Calendar className="h-4 w-4" />
                         <span>Placed: {new Date(order.created_at).toLocaleString()}</span>
                       </div>
                       {order.updated_at !== order.created_at && (
                         <div className="flex items-center space-x-2 mt-1">
                           <RefreshCw className="h-4 w-4" />
                           <span>Updated: {new Date(order.updated_at).toLocaleString()}</span>
                         </div>
                       )}
                     </div>
                     <div className="flex items-center space-x-2">
                       {order.status === 'pending' && (
                         <>
                           <Button
                             size="sm"
                             onClick={() => updateOrderStatus(order.id, 'confirmed')}
                             className="bg-green-600 hover:bg-green-700 text-white"
                           >
                             Confirm Order
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => updateOrderStatus(order.id, 'cancelled')}
                             className="border-red-300 text-red-200 hover:bg-red-900/20"
                           >
                             Cancel
                           </Button>
                         </>
                       )}
                       {order.status === 'confirmed' && (
                         <Button
                           size="sm"
                           onClick={() => updateOrderStatus(order.id, 'processing')}
                           className="bg-blue-600 hover:bg-blue-700 text-white"
                         >
                           Start Processing
                         </Button>
                       )}
                       {order.status === 'processing' && (
                         <Button
                           size="sm"
                           onClick={() => updateOrderStatus(order.id, 'shipped')}
                           className="bg-indigo-600 hover:bg-indigo-700 text-white"
                         >
                           Mark Shipped
                         </Button>
                       )}
                       {order.status === 'shipped' && (
                         <Button
                           size="sm"
                           onClick={() => updateOrderStatus(order.id, 'delivered')}
                           className="bg-green-600 hover:bg-green-700 text-white"
                         >
                           Mark Delivered
                         </Button>
                       )}
                       
                                               {/* Delete Button - Always visible */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirmOrder(order)}
                          className="border-red-500 text-red-400 hover:bg-red-600 hover:text-white ml-2"
                        >
                          Delete
                        </Button>
                     </div>
                   </div>
                </CardContent>
              </Card>
                         ))
           )}
           
           {/* Pagination Controls */}
           <PaginationControls />
         </div>
       </div>
       
       {/* Delete Confirmation Dialog */}
       {deleteConfirmOrder && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
           <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
             <div className="flex items-center space-x-3 mb-4">
               <div className="p-2 bg-red-100 rounded-full">
                 <AlertCircle className="h-6 w-6 text-red-600" />
               </div>
               <h3 className="text-lg font-semibold text-gray-900">Delete Order</h3>
             </div>
             
             <p className="text-gray-600 mb-6">
               Are you sure you want to delete order #{deleteConfirmOrder.id.slice(0, 8)}...? 
               This action cannot be undone and will permanently remove the order and all its items.
             </p>
             
             <div className="flex space-x-3">
               <Button
                 variant="outline"
                 onClick={() => setDeleteConfirmOrder(null)}
                 className="flex-1"
               >
                 Cancel
               </Button>
               <Button
                 variant="destructive"
                 onClick={() => {
                   deleteOrder(deleteConfirmOrder.id);
                   setDeleteConfirmOrder(null);
                 }}
                 className="flex-1"
               >
                 Delete Order
               </Button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default ShopOwnerOrders;
