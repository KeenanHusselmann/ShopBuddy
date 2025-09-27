import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Search, 
  Filter,
  ArrowLeft,
  ShoppingCart,
  Heart,
  Star,
  Eye,
  Building2,
  LogOut
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  is_active: boolean;
  brand: string;
  model: string;
  images?: any;
  inventory?: {
    quantity: number;
    reorder_point: number | null;
  }[];
  categories?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

const CustomerProducts: React.FC = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [cartCount, setCartCount] = useState(0);

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

             // Get active products with inventory and categories
       const { data: productsData, error: productsError } = await supabase
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
         .order("name", { ascending: true });

             if (productsError) {
         console.error("Error fetching products:", productsError);
         toast({
           variant: "destructive",
           title: "Error",
           description: "Failed to load products"
         });
               } else {
          setProducts(productsData || []);
        }

             // Get categories
       const { data: categoriesData, error: categoriesError } = await supabase
         .from("categories")
         .select("id, name")
         .eq("shop_id", shopId)
         .eq("is_active", true)
         .order("name", { ascending: true });

       if (categoriesError) {
         console.error("Error fetching categories:", categoriesError);
       } else {
         setCategories(categoriesData || []);
       }

       // Get cart count
       const { data: cartData, error: cartError } = await supabase
         .from("customer_cart")
         .select("id")
         .eq("customer_id", user.id)
         .eq("shop_id", shopId);

       if (!cartError) {
         setCartCount(cartData?.length || 0);
       }

      setShop(shopData);
      setCustomerProfile(profile);
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

   const addToCart = async (product: Product) => {
     try {
       // Check if item already exists in cart
       const { data: existingItem, error: checkError } = await supabase
         .from("customer_cart")
         .select("id, quantity")
         .eq("customer_id", customerProfile.id)
         .eq("product_id", product.id)
         .eq("shop_id", shopId)
         .single();

       if (checkError && checkError.code !== 'PGRST116') {
         throw checkError;
       }

       if (existingItem) {
         // Update quantity
         const { error: updateError } = await supabase
           .from("customer_cart")
           .update({ quantity: existingItem.quantity + 1 })
           .eq("id", existingItem.id);

         if (updateError) throw updateError;
       } else {
         // Add new item
         const { error: insertError } = await supabase
           .from("customer_cart")
           .insert({
             customer_id: customerProfile.id,
             product_id: product.id,
             shop_id: shopId,
             quantity: 1
           });

         if (insertError) throw insertError;
       }

       // Update cart count
       setCartCount(prev => prev + 1);

       toast({
         title: "Added to cart",
         description: `${product.name} added to cart successfully`
       });
     } catch (error: any) {
       console.error("Error adding to cart:", error);
       toast({
         variant: "destructive",
         title: "Error",
         description: "Failed to add item to cart"
       });
     }
   };

     // Filter and sort products
   const filteredAndSortedProducts = products
     .filter(product => {
       const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
       
       const matchesCategory = selectedCategory === 'all' || 
                              product.categories?.name === selectedCategory;
       
       return matchesSearch && matchesCategory;
     })
     .sort((a, b) => {
       let comparison = 0;
       
       switch (sortBy) {
         case 'name':
           comparison = a.name.localeCompare(b.name);
           break;
         case 'price':
           comparison = a.price - b.price;
           break;
         case 'newest':
           comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
           break;
       }
       
       return sortOrder === 'asc' ? comparison : -comparison;
     });

   

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'bg-red-500' };
    if (quantity <= 5) return { status: 'Low Stock', color: 'bg-yellow-500' };
    return { status: 'In Stock', color: 'bg-green-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-900 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading products...</p>
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
                <p className="text-sm font-medium text-pink-100 bg-pink-900/30 px-3 py-1 rounded-full">Product Catalog</p>
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
                 onClick={() => navigate(`/shop/${shopId}/customer-cart`)}
                 className="text-white hover:text-pink-200 hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-pink-300 relative"
               >
                 <ShoppingCart className="h-4 w-4 mr-2" />
                 Cart
                 {cartCount > 0 && (
                   <Badge className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                     {cartCount}
                   </Badge>
                 )}
               </Button>
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
        {/* Search and Filters */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white font-bold text-xl flex items-center">
                <Search className="h-5 w-5 mr-2 text-pink-300" />
                Browse Products
              </CardTitle>
              <CardDescription className="text-pink-100">
                Discover our amazing products and find what you need
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products by name, description, or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-300 focus:border-pink-300 focus:bg-white/20"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap gap-4">
                {/* Category Filter */}
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-pink-200 text-sm font-medium">Category</Label>
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

                {/* Sort By */}
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-pink-200 text-sm font-medium">Sort By</Label>
                  <Select value={sortBy} onValueChange={(value: 'name' | 'price' | 'newest') => setSortBy(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-pink-200 text-sm font-medium">Order</Label>
                  <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results Count */}
              <div className="text-pink-200 text-sm">
                Showing {filteredAndSortedProducts.length} of {products.length} products
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((product) => {
            const stockStatus = getStockStatus(product.inventory?.[0]?.quantity || 0);
            return (
              <Card key={product.id} className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-2xl hover:from-white/30 hover:to-white/20 transition-all duration-300 group">
                <CardHeader className="pb-3">
                  {/* Product Image */}
                  <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden bg-white/10">
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
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                       <div className="w-16 h-16 bg-gradient-to-br from-pink-500/20 to-rose-600/20 rounded-full flex items-center justify-center mb-2">
                         <Package className="h-8 w-8 text-pink-300" />
                       </div>
                       <p className="text-xs text-pink-200 text-center">No Image</p>
                     </div>
                    
                    {/* Stock Status Badge */}
                    <Badge className={`absolute top-2 right-2 ${stockStatus.color} text-white`}>
                      {stockStatus.status}
                    </Badge>
                  </div>

                  {/* Product Title */}
                  <CardTitle className="text-white font-bold text-lg line-clamp-2 group-hover:text-pink-200 transition-colors">
                    {product.name}
                  </CardTitle>
                  
                  {/* Brand & Model */}
                  <div className="flex items-center space-x-2 text-sm text-pink-200">
                    {product.brand && <span className="font-medium">{product.brand}</span>}
                    {product.model && product.brand && <span>•</span>}
                    {product.model && <span>{product.model}</span>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Description */}
                  <p className="text-pink-100 text-sm line-clamp-2">
                    {product.description}
                  </p>

                  {/* Price */}
                  <div className="text-2xl font-bold text-white">
                    N${product.price.toFixed(2)}
                  </div>

                  {/* SKU */}
                  <div className="text-xs text-pink-200">
                    SKU: {product.sku}
                  </div>

                  {/* Category */}
                  {product.categories?.name && (
                    <Badge variant="outline" className="border-pink-300 text-pink-200">
                      {product.categories.name}
                    </Badge>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                                         <Button 
                       size="sm" 
                       className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                       disabled={stockStatus.status === 'Out of Stock'}
                       onClick={() => addToCart(product)}
                     >
                       <ShoppingCart className="h-4 w-4 mr-2" />
                       Add to Cart
                     </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-pink-300 text-pink-200 hover:bg-pink-300 hover:text-white"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-pink-300 text-pink-200 hover:bg-pink-300 hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Products Message */}
        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
            <p className="text-pink-200">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No products are currently available in this shop'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProducts;
