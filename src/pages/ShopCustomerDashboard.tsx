import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingBag,
  ShoppingCart,
  User,
  Building2,
  LogOut,
  Heart,
  Star,
  Package,
  CreditCard,
  Settings,
  ArrowLeft,
  Edit3,
  Save,
  X,
  Gift,
  Bell,
  Eye,
  EyeOff,
  Shield,
  Palette
} from "lucide-react";

const ShopCustomerDashboard = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [shopDetails, setShopDetails] = useState<any>(null);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  
  // Profile card states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    date_of_birth: ''
  });
  
  // Rewards card states
  const [rewardsData, setRewardsData] = useState({
    points: 0,
    tier: 'Bronze',
    nextTier: 'Silver',
    pointsToNextTier: 100,
    availableRewards: [],
    recentActivity: []
  });
  
  // Preferences card states
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    orderUpdates: true,
    newProducts: true,
    specialOffers: true,
    theme: 'auto',
    language: 'en',
    currency: 'USD'
  });
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  useEffect(() => {
    if (shopId) {
      fetchShopAndCustomerData();
    }
  }, [shopId]);

  const fetchShopAndCustomerData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
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

      setShopDetails(shop);
      setCustomerProfile(profile);
      
      // Initialize profile form
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        date_of_birth: profile.date_of_birth || ''
      });
      
      // Fetch rewards data
      await fetchRewardsData();
      
      // Fetch preferences
      await fetchPreferences();
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load dashboard data"
      });
      navigate("/customer-auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchRewardsData = async () => {
    try {
      // Simulate fetching rewards data (replace with actual API call)
      const mockRewardsData = {
        points: 1250,
        tier: 'Silver',
        nextTier: 'Gold',
        pointsToNextTier: 750,
        availableRewards: [
          { id: 1, name: '10% Off Next Purchase', points: 500, description: 'Get 10% off your next order' },
          { id: 2, name: 'Free Shipping', points: 300, description: 'Free shipping on your next order' },
          { id: 3, name: 'Birthday Gift', points: 1000, description: 'Special birthday surprise' }
        ],
        recentActivity: [
          { id: 1, action: 'Earned points', points: 50, date: '2024-01-15', description: 'Order #12345' },
          { id: 2, action: 'Redeemed reward', points: -300, date: '2024-01-10', description: 'Free Shipping' },
          { id: 3, action: 'Earned points', points: 75, date: '2024-01-05', description: 'Order #12340' }
        ]
      };
      setRewardsData(mockRewardsData);
    } catch (error) {
      console.error("Error fetching rewards:", error);
    }
  };

  const fetchPreferences = async () => {
    try {
      // Simulate fetching preferences (replace with actual API call)
      const mockPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        orderUpdates: true,
        newProducts: true,
        specialOffers: true,
        theme: 'auto',
        language: 'en',
        currency: 'USD'
      };
      setPreferences(mockPreferences);
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const handleProfileEdit = () => {
    setIsEditingProfile(true);
  };

  const handleProfileSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileForm)
        .eq('id', customerProfile.id);

      if (error) throw error;

      setCustomerProfile({ ...customerProfile, ...profileForm });
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile"
      });
    }
  };

  const handleProfileCancel = () => {
    setProfileForm({
      first_name: customerProfile.first_name || '',
      last_name: customerProfile.last_name || '',
      phone: customerProfile.phone || '',
      address: customerProfile.address || '',
      date_of_birth: customerProfile.date_of_birth || ''
    });
    setIsEditingProfile(false);
  };

  const handlePreferencesSave = async () => {
    try {
      // Simulate saving preferences (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsEditingPreferences(false);
      toast({
        title: "Preferences Saved",
        description: "Your preferences have been updated successfully!"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save preferences"
      });
    }
  };

  const handlePreferencesCancel = () => {
    setIsEditingPreferences(false);
    // Reset to original preferences
    fetchPreferences();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-rose-900 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading your customer dashboard...</p>
        </div>
      </div>
    );
  }

  if (!shopDetails || !customerProfile) {
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
                 <h1 className="text-2xl font-bold text-white drop-shadow-lg">{shopDetails.name}</h1>
                 <p className="text-sm font-medium text-pink-100 bg-pink-900/30 px-3 py-1 rounded-full">Customer Portal</p>
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
                 {/* Welcome Section */}
         <div className="mb-8">
           <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-2xl">
             <CardHeader className="text-center pb-6">
               <div className="flex items-center justify-center mb-6">
                 <div className="p-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-xl mr-6">
                   <ShoppingBag className="h-16 w-16 text-white" />
                 </div>
                 <div>
                   <CardTitle className="text-4xl text-white font-bold drop-shadow-lg mb-2">
                     Welcome to {shopDetails.name}!
                   </CardTitle>
                   <CardDescription className="text-xl text-pink-100 font-medium">
                     Your personalized shopping experience awaits
                   </CardDescription>
                 </div>
               </div>
             </CardHeader>
             <CardContent className="text-center">
               <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                 <p className="text-white mb-4 text-xl font-semibold">
                   Hello <span className="text-pink-200 font-bold">{customerProfile.first_name}</span>! You're signed in as a <span className="text-pink-200 font-bold capitalize">{customerProfile.customer_type || 'regular'}</span> customer.
                 </p>
                 {shopDetails.description && (
                   <p className="text-pink-100 italic text-lg bg-pink-900/20 px-4 py-2 rounded-lg">"{shopDetails.description}"</p>
                 )}
               </div>
             </CardContent>
           </Card>
         </div>

                 {/* Quick Actions Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
           <Card 
             className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-2xl hover:from-white/30 hover:to-white/20 transition-all duration-300 cursor-pointer group"
             onClick={() => navigate(`/shop/${shopId}/customer-products`)}
           >
             <CardHeader className="text-center pb-4">
               <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg mx-auto mb-3 group-hover:scale-110 transition-transform">
                 <Package className="h-8 w-8 text-white" />
               </div>
               <CardTitle className="text-lg text-white font-bold">Browse Products</CardTitle>
             </CardHeader>
             <CardContent className="text-center">
               <p className="text-sm text-blue-100 font-medium">Explore our latest products and services</p>
             </CardContent>
           </Card>

           <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-2xl hover:from-white/30 hover:to-white/20 transition-all duration-300 cursor-pointer group">
             <CardHeader className="text-center pb-4">
               <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg mx-auto mb-3 group-hover:scale-110 transition-transform">
                 <Heart className="h-8 w-8 text-white" />
               </div>
               <CardTitle className="text-lg text-white font-bold">Wishlist</CardTitle>
             </CardHeader>
             <CardContent className="text-center">
               <p className="text-sm text-red-100 font-medium">Save your favorite items for later</p>
             </CardContent>
           </Card>

           <Card 
             className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-2xl hover:from-white/30 hover:to-white/20 transition-all duration-300 cursor-pointer group"
             onClick={() => navigate(`/shop/${shopId}/customer-cart`)}
           >
             <CardHeader className="text-center pb-4">
               <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mx-auto mb-3 group-hover:scale-110 transition-transform">
                 <ShoppingCart className="h-8 w-8 text-white" />
               </div>
               <CardTitle className="text-lg text-white font-bold">Shopping Cart</CardTitle>
             </CardHeader>
             <CardContent className="text-center">
               <p className="text-sm text-blue-100 font-medium">View and manage your shopping cart items</p>
             </CardContent>
           </Card>

           <Card 
             className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-2xl hover:from-white/30 hover:to-white/20 transition-all duration-300 cursor-pointer group"
             onClick={() => navigate(`/shop/${shopId}/customer-orders`)}
           >
             <CardHeader className="text-center pb-4">
               <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg mx-auto mb-3 group-hover:scale-110 transition-transform">
                 <CreditCard className="h-8 w-8 text-white" />
               </div>
               <CardTitle className="text-lg text-white font-bold">Orders</CardTitle>
             </CardHeader>
             <CardContent className="text-center">
               <p className="text-sm text-green-100 font-medium">View your order history and track current orders</p>
             </CardContent>
           </Card>

           <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-2xl hover:from-white/30 hover:to-white/20 transition-all duration-300 cursor-pointer group"
             onClick={() => setShowRewardsModal(true)}>
             <CardHeader className="text-center pb-4">
               <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg mx-auto mb-3 group-hover:scale-110 transition-transform">
                 <Star className="h-8 w-8 text-white" />
               </div>
               <CardTitle className="text-lg text-white font-bold">Rewards</CardTitle>
             </CardHeader>
             <CardContent className="text-center">
               <p className="text-sm text-yellow-100 font-medium">Check your loyalty points and rewards</p>
             </CardContent>
           </Card>

           <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-2xl hover:from-white/30 hover:to-white/20 transition-all duration-300 cursor-pointer group"
             onClick={() => setIsEditingProfile(true)}>
             <CardHeader className="text-center pb-4">
               <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg mx-auto mb-3 group-hover:scale-110 transition-transform">
                 <User className="h-8 w-8 text-white" />
               </div>
               <CardTitle className="text-lg text-white font-bold">Profile</CardTitle>
             </CardHeader>
             <CardContent className="text-center">
               <p className="text-sm text-purple-100 font-medium">Update your personal information</p>
             </CardContent>
           </Card>

           <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-2xl hover:from-white/30 hover:to-white/20 transition-all duration-300 cursor-pointer group"
             onClick={() => setIsEditingPreferences(true)}>
             <CardHeader className="text-center pb-4">
               <div className="p-3 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl shadow-lg mx-auto mb-3 group-hover:scale-110 transition-transform">
                 <Settings className="h-8 w-8 text-white" />
               </div>
               <CardTitle className="text-lg text-white font-bold">Preferences</CardTitle>
             </CardHeader>
             <CardContent className="text-center">
               <p className="text-sm text-gray-100 font-medium">Customize your shopping experience</p>
             </CardContent>
           </Card>
         </div>

                 {/* Customer Information */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
             <CardHeader className="pb-4">
               <CardTitle className="flex items-center space-x-3 text-white font-bold text-lg">
                 <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg">
                   <User className="h-5 w-5 text-white" />
                 </div>
                 <span>Your Information</span>
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                 <div className="flex justify-between items-center">
                   <span className="text-pink-200 font-semibold text-sm uppercase tracking-wide">Name:</span>
                   <span className="font-bold text-white text-lg">
                     {customerProfile.first_name} {customerProfile.last_name}
                   </span>
                 </div>
               </div>
               <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                 <div className="flex justify-between items-center">
                   <span className="text-pink-200 font-semibold text-sm uppercase tracking-wide">Email:</span>
                   <span className="font-bold text-white text-lg">{customerProfile.email}</span>
                 </div>
               </div>
               {customerProfile.phone && (
                 <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                   <div className="flex justify-between items-center">
                     <span className="text-pink-200 font-semibold text-sm uppercase tracking-wide">Phone:</span>
                     <span className="font-bold text-white text-lg">{customerProfile.phone}</span>
                   </div>
                 </div>
               )}
               <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                 <div className="flex justify-between items-center">
                   <span className="text-pink-200 font-semibold text-sm uppercase tracking-wide">Customer Type:</span>
                   <span className="font-bold text-pink-300 text-lg capitalize bg-pink-900/30 px-3 py-1 rounded-full">
                     {customerProfile.customer_type || 'Regular'}
                   </span>
                 </div>
               </div>
               <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                 <div className="flex justify-between items-center">
                   <span className="text-pink-200 font-semibold text-sm uppercase tracking-wide">Member Since:</span>
                   <span className="font-bold text-white text-lg">
                     {new Date(customerProfile.created_at).toLocaleDateString()}
                   </span>
                 </div>
               </div>
             </CardContent>
           </Card>

           <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-lg">
             <CardHeader className="pb-4">
               <CardTitle className="flex items-center space-x-3 text-white font-bold text-lg">
                 <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                   <Building2 className="h-5 w-5 text-white" />
                 </div>
                 <span>Shop Information</span>
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                 <div className="flex justify-between items-center">
                   <span className="text-blue-200 font-semibold text-sm uppercase tracking-wide">Shop Name:</span>
                   <span className="font-bold text-white text-lg">{shopDetails.name}</span>
                 </div>
               </div>
               {shopDetails.description && (
                 <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                   <div className="flex justify-between items-center">
                     <span className="text-blue-200 font-semibold text-sm uppercase tracking-wide">Description:</span>
                     <span className="font-bold text-white text-sm bg-blue-900/30 px-3 py-1 rounded-lg max-w-xs text-right">{shopDetails.description}</span>
                   </div>
                 </div>
               )}
               <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                 <div className="flex justify-between items-center">
                   <span className="text-blue-200 font-semibold text-sm uppercase tracking-wide">Portal Type:</span>
                   <span className="font-bold text-blue-300 text-lg bg-blue-900/30 px-3 py-1 rounded-full">Customer Portal</span>
                 </div>
               </div>
               <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                 <div className="flex justify-between items-center">
                   <span className="text-blue-200 font-semibold text-sm uppercase tracking-wide">Status:</span>
                   <span className="font-bold text-green-300 text-lg bg-green-900/30 px-3 py-1 rounded-full">Active</span>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>

                 {/* Navigation */}
         <div className="text-center mt-8">
           <Button
             variant="ghost"
             onClick={() => navigate("/")}
             className="text-pink-100 hover:text-white hover:bg-pink-800/30 px-6 py-3 rounded-xl transition-all duration-200 border border-pink-300/30 hover:border-pink-300 hover:shadow-lg"
           >
             <ArrowLeft className="h-5 w-5 mr-2" />
             Back to Home
           </Button>
         </div>
      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-2xl w-full max-w-2xl">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-white text-xl">Edit Profile</CardTitle>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleProfileSave}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleProfileCancel}
                  className="border-white/30 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-white text-sm font-medium">First Name</Label>
                  <Input
                    id="first_name"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-white text-sm font-medium">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                    placeholder="Last Name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-white text-sm font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  placeholder="Phone Number"
                />
              </div>
              <div>
                <Label htmlFor="address" className="text-white text-sm font-medium">Address</Label>
                <Textarea
                  id="address"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  placeholder="Enter your address"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="date_of_birth" className="text-white text-sm font-medium">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={profileForm.date_of_birth}
                  onChange={(e) => setProfileForm({...profileForm, date_of_birth: e.target.value})}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rewards Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-white text-xl flex items-center">
                <Gift className="h-6 w-6 mr-2 text-yellow-400" />
                Your Rewards & Loyalty
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRewardsModal(false)}
                className="border-white/30 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Points Summary */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-300/30">
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-300 mb-2">{rewardsData.points}</div>
                  <div className="text-white text-lg mb-1">Loyalty Points</div>
                  <div className="text-yellow-200 text-sm">Current Tier: {rewardsData.tier}</div>
                  <div className="mt-3 bg-yellow-900/30 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((rewardsData.points - (rewardsData.tier === 'Bronze' ? 0 : rewardsData.tier === 'Silver' ? 1000 : 2000)) / rewardsData.pointsToNextTier) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-yellow-200 text-sm mt-2">
                    {rewardsData.pointsToNextTier} points to {rewardsData.nextTier}
                  </div>
                </div>
              </div>

              {/* Available Rewards */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Available Rewards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rewardsData.availableRewards.map((reward) => (
                    <div key={reward.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-semibold">{reward.name}</h4>
                        <span className="text-yellow-300 font-bold">{reward.points} pts</span>
                      </div>
                      <p className="text-pink-100 text-sm mb-3">{reward.description}</p>
                      <Button 
                        size="sm" 
                        className="bg-yellow-600 hover:bg-yellow-700 text-white w-full"
                        disabled={rewardsData.points < reward.points}
                      >
                        {rewardsData.points >= reward.points ? 'Redeem' : 'Not Enough Points'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {rewardsData.recentActivity.map((activity) => (
                    <div key={activity.id} className="bg-white/10 rounded-lg p-3 border border-white/20">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-white font-medium">{activity.action}</div>
                          <div className="text-pink-200 text-sm">{activity.description}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${activity.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {activity.points > 0 ? '+' : ''}{activity.points}
                          </div>
                          <div className="text-pink-200 text-xs">{activity.date}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preferences Modal */}
      {isEditingPreferences && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-white text-xl">Preferences & Settings</CardTitle>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handlePreferencesSave}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePreferencesCancel}
                  className="border-white/30 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Preferences */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white text-sm font-medium">Email Notifications</Label>
                      <p className="text-pink-200 text-xs">Receive order updates via email</p>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => setPreferences({...preferences, emailNotifications: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white text-sm font-medium">SMS Notifications</Label>
                      <p className="text-pink-200 text-xs">Receive order updates via SMS</p>
                    </div>
                    <Switch
                      checked={preferences.smsNotifications}
                      onCheckedChange={(checked) => setPreferences({...preferences, smsNotifications: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white text-sm font-medium">Marketing Emails</Label>
                      <p className="text-pink-200 text-xs">Receive promotional content</p>
                    </div>
                    <Switch
                      checked={preferences.marketingEmails}
                      onCheckedChange={(checked) => setPreferences({...preferences, marketingEmails: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white text-sm font-medium">Order Updates</Label>
                      <p className="text-pink-200 text-xs">Get notified about order status changes</p>
                    </div>
                    <Switch
                      checked={preferences.orderUpdates}
                      onCheckedChange={(checked) => setPreferences({...preferences, orderUpdates: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white text-sm font-medium">New Products</Label>
                      <p className="text-pink-200 text-xs">Be notified about new arrivals</p>
                    </div>
                    <Switch
                      checked={preferences.newProducts}
                      onCheckedChange={(checked) => setPreferences({...preferences, newProducts: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white text-sm font-medium">Special Offers</Label>
                      <p className="text-pink-200 text-xs">Receive exclusive deals and discounts</p>
                    </div>
                    <Switch
                      checked={preferences.specialOffers}
                      onCheckedChange={(checked) => setPreferences({...preferences, specialOffers: checked})}
                    />
                  </div>
                </div>
              </div>

              {/* Display Preferences */}
              <div>
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Display Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="theme" className="text-white text-sm font-medium">Theme</Label>
                    <Select value={preferences.theme} onValueChange={(value) => setPreferences({...preferences, theme: value})}>
                      <SelectTrigger className="bg-white/10 border-white/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language" className="text-white text-sm font-medium">Language</Label>
                    <Select value={preferences.language} onValueChange={(value) => setPreferences({...preferences, language: value})}>
                      <SelectTrigger className="bg-white/10 border-white/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency" className="text-white text-sm font-medium">Currency</Label>
                    <Select value={preferences.currency} onValueChange={(value) => setPreferences({...preferences, currency: value})}>
                      <SelectTrigger className="bg-white/10 border-white/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD (N$)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ShopCustomerDashboard;
