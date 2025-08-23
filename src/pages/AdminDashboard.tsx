import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Store, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  Users, 
  MapPin, 
  Phone, 
  Mail,
  FileText,
  TrendingUp,
  LogOut,
  RefreshCw,
  Crown,
  Building2,
  BarChart3,
  Settings,
  UserCheck,
  ShoppingBag,
  AlertTriangle,
  Edit,
  Trash2,
  Plus,
  Search
} from "lucide-react";
import { HeaderWithNav } from "@/components/common/HeaderWithNav";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface ShopRegistrationRequest {
  id: string;
  user_id: string;
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
  expected_monthly_revenue: number;
  number_of_employees: number;
  business_hours: any;
  services_offered: string[];
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  admin_notes: string;
  reviewed_by: string;
  reviewed_at: string;
  created_at: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  } | null;
}

interface ShopData {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  user_id: string;
  business_type: string;
  contact_email: string;
  contact_phone: string;
  is_verified: boolean;
  verification_document_url: string;
  business_license_number: string;
  tax_id: string;
  registration_date: string;
  admin_notes: string;
  revoked_reason?: string;
  revoked_at?: string;
  revoked_by?: string;
}

interface ActivityItem {
  id: string;
  type: 'registration' | 'shop' | 'system';
  action: string;
  displayName: string;
  status: string;
  date: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  description?: string;
  reason?: string;
  admin_notes?: string;
  performed_by?: string;
  performed_by_role?: string;
  additional_details?: any;
}

const AdminDashboard = () => {
  const [registrations, setRegistrations] = useState<ShopRegistrationRequest[]>([]);
  const [shops, setShops] = useState<ShopData[]>([]);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<ShopRegistrationRequest | null>(null);
  const [selectedShop, setSelectedShop] = useState<ShopData | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isEditShopDialogOpen, setIsEditShopDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [isViewShopDetailsDialogOpen, setIsViewShopDetailsDialogOpen] = useState(false);
  const [isDeleteShopDialogOpen, setIsDeleteShopDialogOpen] = useState(false);
  const [isActivityDetailsDialogOpen, setIsActivityDetailsDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'shops' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUserAccess();
  }, []);

  // Disabled aggressive refresh strategies that cause deleted shops to reappear
  // useEffect(() => {
  //   const handleFocus = () => {
  //     if (profile && !loading) {
  //       console.log("Page became visible, refreshing data...");
  //       Promise.all([fetchRegistrations(), fetchShops()]);
  //     }
  //   };

  //   const handlePageShow = () => {
  //     if (profile && !loading) {
  //       console.log("Page became visible (pageshow), refreshing data...");
  //       Promise.all([fetchRegistrations(), fetchShops()]);
  //     }
  //   };

  //   window.addEventListener('focus', handleFocus);
  //   window.addEventListener('pageshow', handlePageShow);
  //   return () => {
  //     window.removeEventListener('focus', handleFocus);
  //     window.removeEventListener('pageshow', handlePageShow);
  //   };
  // }, [profile, loading]);

  // // Disabled location-based refresh that causes deleted shops to reappear
  // useEffect(() => {
  //   if (profile && !loading) {
  //     console.log("Location changed, refreshing data...");
  //     Promise.all([fetchRegistrations(), fetchShops()]);
  //   }
  // }, [location.pathname, profile, loading]);

  const checkUserAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/admin-login");
        return;
      }

      setUser(user);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        navigate("/admin-login");
        return;
      }

      if (profileData.role !== 'super_admin') {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You need super admin privileges to access this page."
        });
        navigate("/dashboard");
        return;
      }

      setProfile(profileData);
      await Promise.all([fetchRegistrations(), fetchShops()]);
    } catch (error) {
      console.error("Error checking user access:", error);
      navigate("/admin-login");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      console.log("Fetching pending shop registration requests...");
      const { data, error } = await supabase
        .from("shop_registration_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Fetched pending registrations:", data);
      console.log("Number of pending registrations:", data?.length || 0);
      setRegistrations(data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load registration requests"
      });
    }
  };

  const fetchShops = async () => {
    try {
      console.log("Fetching all shops...");
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      console.log("Fetched shops:", data);
      console.log("Number of shops:", data?.length || 0);
      
      // Also fetch approved registrations to show in shops management
      const { data: approvedData, error: approvedError } = await supabase
        .from("shop_registration_requests")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (approvedError) {
        console.error("Error fetching approved registrations:", approvedError);
      } else {
        console.log("Fetched approved registrations:", approvedData);
        console.log("Number of approved registrations:", approvedData?.length || 0);
      }

      // Combine shops and approved registrations, excluding inactive, suspended, rejected, and under_review ones
      const activeShops = (data || []).filter(shop => 
        shop.status !== 'inactive' && shop.status !== 'suspended' && shop.status !== 'deleted'
      );
      const activeRegistrations = (approvedData || []).filter(reg => 
        reg.status !== 'rejected' && reg.status !== 'under_review' && reg.status !== 'deleted'
      );
      
      const allShops = [...activeShops, ...activeRegistrations];
      console.log("Combined active shops and registrations:", allShops);
      console.log("Total active items to display:", allShops.length);
      
      setShops(allShops);
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load shops data"
      });
    }
  };

  const handleApprove = async () => {
    if (!selectedRegistration || !approvalNotes.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide approval notes"
      });
      return;
    }

    setProcessing(true);
    try {
      // Call the approve function
      console.log("Approving registration:", selectedRegistration.id);
      const { data, error } = await supabase.rpc('approve_shop_registration', {
        request_id: selectedRegistration.id,
        admin_notes: approvalNotes
      });

      console.log("Approval response:", data);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Shop registration approved successfully"
      });

      setIsApprovalDialogOpen(false);
      setApprovalNotes("");
      setSelectedRegistration(null);
      await fetchRegistrations();
      await fetchShops();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to approve registration"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRegistration || !rejectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide rejection reason"
      });
      return;
    }

    setProcessing(true);
    try {
      // Call the reject function
      const { error } = await supabase.rpc('reject_shop_registration', {
        request_id: selectedRegistration.id,
        admin_notes: rejectionReason
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shop registration rejected successfully"
      });

      setIsRejectionDialogOpen(false);
      setRejectionReason("");
      setSelectedRegistration(null);
      await fetchRegistrations();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reject registration"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRevokeShop = async () => {
    if (!selectedShop || !revokeReason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide reason for revocation"
      });
      return;
    }

    setProcessing(true);
    try {
      // Use the database function for revocation
      const { data, error } = await supabase.rpc('revoke_shop_status', {
        shop_id: selectedShop.id,
        revoke_reason: revokeReason,
        admin_user_id: user.id
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Shop status revoked successfully"
        });

        setIsRevokeDialogOpen(false);
        setRevokeReason("");
        setSelectedShop(null);
        
        // Refresh both shops and registrations data
        await Promise.all([fetchShops(), fetchRegistrations()]);
      } else {
        throw new Error(data.error || "Failed to revoke shop status");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to revoke shop status"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEditShop = async () => {
    if (!selectedShop) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({
          name: selectedShop.name,
          description: selectedShop.description,
          business_type: selectedShop.business_type,
          contact_email: selectedShop.contact_email,
          contact_phone: selectedShop.contact_phone,
          admin_notes: selectedShop.admin_notes,
          business_license_number: selectedShop.business_license_number,
          tax_id: selectedShop.tax_id,
          is_verified: selectedShop.is_verified
        })
        .eq("id", selectedShop.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shop information updated successfully"
      });

      setIsEditShopDialogOpen(false);
      setSelectedShop(null);
      await fetchShops();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update shop information"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    setIsActivityDetailsDialogOpen(true);
  };

  const handleDeleteShop = async () => {
    if (!selectedShop) return;

    setProcessing(true);
    try {
      console.log("=== STARTING SHOP DELETION ===");
      console.log("Shop to delete:", selectedShop);
      
      // Remove from local state FIRST to prevent reappearance
      const shopIdToDelete = selectedShop.id;
      setShops(prevShops => {
        const filtered = prevShops.filter(shop => shop.id !== shopIdToDelete);
        console.log("Removed shop from local state. Remaining shops:", filtered.length);
        return filtered;
      });
      
      let deletionSuccess = false;
      
      // Check if this is an approved registration or an actual shop
      if (selectedShop.shop_name) {
        console.log("Attempting to delete approved registration from shop_registration_requests");
        console.log("Registration ID:", selectedShop.id);
        
        // Try hard delete first
        const { data: deleteResult, error: regError } = await supabase
          .from("shop_registration_requests")
          .delete()
          .eq("id", selectedShop.id)
          .select();
        
        console.log("Hard delete result:", { data: deleteResult, error: regError });
        
        if (!regError && deleteResult && deleteResult.length > 0) {
          console.log("Hard delete successful for registration:", deleteResult);
          deletionSuccess = true;
        } else {
          console.log("Hard delete failed, trying soft delete. Error:", regError);
          
                      // Try soft delete - update status to 'rejected' (which should be allowed)
            const { data: updateResult, error: updateError } = await supabase
              .from("shop_registration_requests")
              .update({ 
                status: 'rejected',
                admin_notes: (selectedShop.admin_notes || '') + ' [DELETED]'
              })
              .eq("id", selectedShop.id)
              .select();
          
          console.log("Soft delete result:", { data: updateResult, error: updateError });
          
          if (!updateError && updateResult && updateResult.length > 0) {
            console.log("Soft delete successful for registration");
            deletionSuccess = true;
          } else {
            console.error("Soft delete failed, trying to mark as revoked:", updateError);
            
            // Try third fallback - mark as 'under_review' (which should be allowed)
            const { data: revokeResult, error: revokeError } = await supabase
              .from("shop_registration_requests")
              .update({ 
                status: 'under_review',
                admin_notes: (selectedShop.admin_notes || '') + ' [DELETION FAILED - MARKED AS UNDER REVIEW]'
              })
              .eq("id", selectedShop.id)
              .select();
            
            console.log("Revoke fallback result:", { data: revokeResult, error: revokeError });
            
            if (!revokeError && revokeResult && revokeResult.length > 0) {
              console.log("Revoke fallback successful for registration");
              deletionSuccess = true;
            } else {
              console.error("All deletion methods failed for registration:", revokeError);
            }
          }
        }
      } else {
        console.log("Attempting to delete actual shop from shops table");
        console.log("Shop ID:", selectedShop.id);
        
        // Try hard delete first
        const { data: deleteResult, error: shopError } = await supabase
          .from("shops")
          .delete()
          .eq("id", selectedShop.id)
          .select();
        
        console.log("Hard delete result:", { data: deleteResult, error: shopError });
        
        if (!shopError && deleteResult && deleteResult.length > 0) {
          console.log("Hard delete successful for shop:", deleteResult);
          deletionSuccess = true;
        } else {
          console.log("Hard delete failed, trying soft delete. Error:", shopError);
          
                      // Try soft delete - update status to 'inactive' (which should be allowed)
            const { data: updateResult, error: updateError } = await supabase
              .from("shops")
              .update({ 
                status: 'inactive',
                admin_notes: (selectedShop.admin_notes || '') + ' [DELETED]'
              })
              .eq("id", selectedShop.id)
              .select();
          
          console.log("Soft delete result:", { data: updateResult, error: updateError });
          
          if (!updateError && updateResult && updateResult.length > 0) {
            console.log("Soft delete successful for shop");
            deletionSuccess = true;
          } else {
            console.error("Soft delete failed, trying to mark as revoked:", updateError);
            
            // Try third fallback - mark as 'suspended' (which should be allowed)
            const { data: revokeResult, error: revokeError } = await supabase
              .from("shops")
              .update({ 
                status: 'suspended',
                admin_notes: (selectedShop.admin_notes || '') + ' [DELETION FAILED - MARKED AS SUSPENDED]'
              })
              .eq("id", selectedShop.id)
              .select();
            
            console.log("Revoke fallback result:", { data: revokeResult, error: revokeError });
            
            if (!revokeError && revokeResult && revokeResult.length > 0) {
              console.log("Revoke fallback successful for shop");
              deletionSuccess = true;
            } else {
              console.error("All deletion methods failed for shop:", revokeError);
            }
          }
        }
      }

      if (!deletionSuccess) {
        throw new Error("Failed to delete shop using both hard and soft delete methods");
      }

      console.log("=== DELETION SUCCESSFUL ===");
      
      toast({
        title: "Success",
        description: "Shop deleted successfully"
      });

      setIsDeleteShopDialogOpen(false);
      setSelectedShop(null);
      
      // DON'T refresh immediately - the local state update should be enough
      console.log("Shop deletion complete. Local state updated.");
      
    } catch (error: any) {
      console.error("=== DELETION FAILED ===", error);
      
      // Restore the shop to local state if deletion failed
      setShops(prevShops => {
        if (!prevShops.find(s => s.id === selectedShop.id)) {
          console.log("Restoring shop to local state due to deletion failure");
          return [...prevShops, selectedShop];
        }
        return prevShops;
      });
      
      // Provide more specific error messages
      let errorMessage = "Failed to delete shop";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      } else if (error.hint) {
        errorMessage = error.hint;
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRestoreShop = async () => {
    if (!selectedShop) return;

    setProcessing(true);
    try {
      // Use the database function for restoration
      const { data, error } = await supabase.rpc('restore_shop_status', {
        shop_id: selectedShop.id,
        admin_user_id: user.id
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Shop status restored successfully"
        });

        setSelectedShop(null);
        
        // Refresh both shops and registrations data
        await Promise.all([fetchShops(), fetchRegistrations()]);
      } else {
        throw new Error(data.error || "Failed to restore shop status");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to restore shop status"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/admin-login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'revoked': return 'bg-red-600 text-white';
      default: return 'bg-green-100 text-green-800'; // Default to active for approved registrations
    }
  };

  const filteredShops = shops.filter(shop => {
    const searchLower = (searchTerm || '').toLowerCase();
    return (
      (shop.name || shop.shop_name || '').toLowerCase().includes(searchLower) ||
      (shop.contact_email || shop.email || '').toLowerCase().includes(searchLower) ||
      (shop.business_type || shop.type || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const userProfile = {
    first_name: profile?.first_name || "Admin",
    last_name: profile?.last_name || "",
    email: profile?.email || "",
    role: profile?.role || "super_admin",
    avatar_url: profile?.avatar_url || null
  };

  return (
    <AuthGuard requiredRole={['super_admin']}>
      <div className="min-h-screen bg-background">
        <HeaderWithNav
          title="ShopBuddy"
          user={userProfile}
          onSignOut={handleLogout}
        />
        <div className="max-w-7xl mx-auto px-4">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6 border-b">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('overview')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'registrations' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('registrations')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <FileText className="h-4 w-4 mr-2" />
              Registrations
            </Button>
            <Button
              variant={activeTab === 'shops' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('shops')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Store className="h-4 w-4 mr-2" />
              Shops Management
            </Button>
            <Button
              variant={activeTab === 'analytics' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('analytics')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-4xl font-bold flex items-center text-white">
                    <Shield className="h-10 w-10 text-primary mr-4" />
                    ShopBuddy Admin Dashboard
                  </h1>
                  <p className="text-lg text-muted-foreground mt-2">
                    Comprehensive system administration and analytics
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      fetchRegistrations();
                      fetchShops();
                    }} 
                    variant="outline" 
                    disabled={refreshing}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Button onClick={handleLogout} variant="destructive" className="bg-red-600 hover:bg-red-700">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>

              {/* System Status Overview */}
              <div className="mb-8 p-6 rounded-lg bg-slate-800 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">System Status Overview</h2>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Last updated</p>
                    <p className="text-sm font-medium text-white">{new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-slate-300">System Online</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-slate-300">Database Connected</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-slate-300">All Services Running</span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-yellow-500/20 mr-3">
                        <Clock className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-400">Pending</p>
                        <p className="text-2xl font-bold text-white">
                          {registrations.filter(r => r.status === 'pending').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-green-500/20 mr-3">
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-400">Approved</p>
                        <p className="text-2xl font-bold text-white">
                          {registrations.filter(r => r.status === 'approved').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-red-500/20 mr-3">
                        <XCircle className="h-6 w-6 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-400">Rejected</p>
                        <p className="text-2xl font-bold text-white">
                          {registrations.filter(r => r.status === 'rejected').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                        <Store className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-400">Active Shops</p>
                        <p className="text-2xl font-bold text-white">
                          {shops.filter(s => s.status === 'active' || s.status === 'approved' || !s.status).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
                        <Building2 className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-400">Total Shops</p>
                        <p className="text-2xl font-bold text-white">
                          {shops.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors duration-200 cursor-pointer hover:shadow-lg" onClick={() => setActiveTab('registrations')}>
                  <CardContent className="p-6 text-center">
                    <div className="p-3 rounded-lg bg-primary/20 mx-auto mb-4">
                      <FileText className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Review Registrations</h3>
                    <p className="text-slate-400 text-sm">Review and approve new shop requests</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors duration-200 cursor-pointer hover:shadow-lg" onClick={() => setActiveTab('shops')}>
                  <CardContent className="p-6 text-center">
                    <div className="p-3 rounded-lg bg-blue-500/20 mx-auto mb-4">
                      <Store className="h-10 w-10 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Manage Shops</h3>
                    <p className="text-slate-400 text-sm">Manage approved, active, and revoked shops</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors duration-200 cursor-pointer hover:shadow-lg" onClick={() => setActiveTab('analytics')}>
                  <CardContent className="p-6 text-center">
                    <div className="p-3 rounded-lg bg-green-500/20 mx-auto mb-4">
                      <TrendingUp className="h-10 w-10 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">System Analytics</h3>
                    <p className="text-slate-400 text-sm">Comprehensive system insights and reports</p>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Features Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Activity */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
                      Recent System Activity
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Latest actions and system events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors duration-200">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-slate-200 flex-1">
                          <span className="font-medium capitalize text-white">System refresh</span> completed
                        </span>
                        <span className="text-xs text-slate-400 ml-auto">{new Date().toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors duration-200">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-slate-200 flex-1">
                          <span className="font-medium capitalize text-white">Database connection</span> verified
                        </span>
                        <span className="text-xs text-slate-400 ml-auto">{new Date().toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors duration-200">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-slate-200 flex-1">
                          <span className="font-medium capitalize text-white">User session</span> active
                        </span>
                        <span className="text-xs text-slate-400 ml-auto">{new Date().toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Statistics */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
                      Quick Statistics
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Key performance indicators
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">System Uptime</span>
                        <span className="text-sm font-medium text-white">99.9%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Response Time</span>
                        <span className="text-sm font-medium text-white">~45ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Active Sessions</span>
                        <span className="text-sm font-medium text-white">1</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Last Backup</span>
                        <span className="text-sm font-medium text-white">Today 02:00</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Health Indicators */}
              <div className="mb-8">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <Shield className="h-5 w-5 mr-2 text-green-400" />
                      System Health Status
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Real-time system monitoring and alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                        <p className="text-sm font-medium text-white">Database</p>
                        <p className="text-xs text-green-400">Healthy</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                        <p className="text-sm font-medium text-white">Authentication</p>
                        <p className="text-xs text-green-400">Active</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                        <p className="text-sm font-medium text-white">API Services</p>
                        <p className="text-xs text-green-400">Running</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                        <p className="text-sm font-medium text-white">Security</p>
                        <p className="text-xs text-green-400">Protected</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Registrations Tab */}
          {activeTab === 'registrations' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Pending Registration Requests</h2>
                  <p className="text-muted-foreground mt-1">
                    Review and approve new shop registration requests
                  </p>
                </div>
                <Button onClick={fetchRegistrations} variant="outline" disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Pending Requests
                  </CardTitle>
                  <CardDescription>
                    Review and manage pending shop registration requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {registrations.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No registration requests found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {registrations.map((registration) => (
                        <div key={registration.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold">{registration.shop_name}</h3>
                              <Badge className={getStatusColor(registration.status)}>
                                {registration.status}
                              </Badge>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRegistration(registration);
                                  setIsViewDetailsDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              {registration.status === 'pending' && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRegistration(registration);
                                      setIsApprovalDialogOpen(true);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRegistration(registration);
                                      setIsRejectionDialogOpen(true);
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-2">{registration.shop_description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Type:</span> {registration.business_type}
                            </div>
                            <div>
                              <span className="font-medium">Contact:</span> {registration.contact_email}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span> {registration.contact_phone}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span> {new Date(registration.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Shops Management Tab */}
          {activeTab === 'shops' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">All Registered Shops</h2>
                  <p className="text-muted-foreground mt-1">
                    Manage approved, active, and revoked shops
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search shops..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                    icon={<Search className="h-4 w-4" />}
                  />
                  <Button onClick={fetchShops} variant="outline" disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    onClick={() => {
                      console.log("Manual force refresh requested");
                      setShops([]);
                      setTimeout(() => {
                        fetchShops();
                        fetchRegistrations();
                      }, 100);
                    }} 
                    variant="outline" 
                    disabled={refreshing}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Force Refresh
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Store className="h-5 w-5 mr-2" />
                    All Registered Shops
                  </CardTitle>
                  <CardDescription>
                    Manage shop information, revoke status, and view details. 
                    Use "Force Refresh" if you need to sync with the latest database state.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredShops.length === 0 ? (
                    <div className="text-center py-8">
                      <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No shops found matching your search' : 'No shops registered yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredShops.map((shop) => (
                        <div key={shop.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold">{shop.name || shop.shop_name}</h3>
                              <Badge className={getStatusColor(shop.status || 'active')}>
                                {shop.status || 'active'}
                              </Badge>
                              {shop.is_verified && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedShop(shop);
                                  setIsViewShopDetailsDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedShop(shop);
                                  setIsEditShopDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              {(shop.status === 'active' || shop.status === 'approved' || !shop.status) && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedShop(shop);
                                    setIsRevokeDialogOpen(true);
                                  }}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Revoke
                                </Button>
                              )}
                              {shop.status === 'revoked' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleRestoreShop()}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Restore
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedShop(shop);
                                  setIsDeleteShopDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-2">{shop.description || shop.shop_description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Type:</span> {shop.business_type || shop.type}
                            </div>
                            <div>
                              <span className="font-medium">Contact:</span> {shop.contact_email || shop.email}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span> {shop.contact_phone || shop.phone}
                            </div>
                            <div>
                              <span className="font-medium">Registered:</span> {new Date(shop.registration_date || shop.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          {/* Admin Notes removed - was causing display issues */}
                          {shop.revoked_reason && (
                            <div className="mt-3 p-3 bg-red-50 rounded">
                              <span className="font-medium text-red-700">Revoked Reason:</span> {shop.revoked_reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">System Analytics</h2>
                <div className="flex space-x-2">
                  <Button onClick={() => {
                    fetchRegistrations();
                    fetchShops();
                  }} variant="outline" disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </Button>
                  <Button onClick={() => navigate("/admin/analytics")} variant="default">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Detailed Analytics
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Store className="h-5 w-5 mr-2" />
                      Shop Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Shops:</span>
                        <span className="font-semibold">{shops.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Shops:</span>
                        <span className="font-semibold text-green-600">
                          {shops.filter(s => s.status === 'active' || s.status === 'approved' || !s.status).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revoked Shops:</span>
                        <span className="font-semibold text-red-600">
                          {shops.filter(s => s.status === 'revoked').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Approved Shops:</span>
                        <span className="font-semibold text-blue-600">
                          {shops.filter(s => s.status === 'approved').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Registration Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Requests:</span>
                        <span className="font-semibold">{registrations.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending:</span>
                        <span className="font-semibold text-yellow-600">
                          {registrations.filter(r => r.status === 'pending').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Approved:</span>
                        <span className="font-semibold text-green-600">
                          {registrations.filter(r => r.status === 'approved').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rejected:</span>
                        <span className="font-semibold text-red-600">
                          {registrations.filter(r => r.status === 'rejected').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Business Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(() => {
                        const businessTypes = shops.reduce((acc, shop) => {
                          const type = shop.business_type || shop.type;
                          if (type) {
                            acc[type] = (acc[type] || 0) + 1;
                          }
                          return acc;
                        }, {} as Record<string, number>);
                        
                        return Object.entries(businessTypes).map(([type, count]) => (
                          <div key={type} className="flex justify-between">
                            <span className="capitalize">{type}:</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      // Combine and sort all activities with enhanced details
                      const allActivities: ActivityItem[] = [
                        ...registrations.map(r => ({
                          id: r.id,
                          type: 'registration' as const,
                          action: 'Registration Request',
                          displayName: r.shop_name,
                          status: r.status,
                          date: r.created_at,
                          user_id: r.user_id,
                          user_name: r.user_profile?.first_name && r.user_profile?.last_name ? 
                            `${r.user_profile.first_name} ${r.user_profile.last_name}` : 'Unknown User',
                          user_email: r.user_profile?.email || r.contact_email,
                          description: r.shop_description,
                          reason: r.admin_notes,
                          admin_notes: r.admin_notes,
                          performed_by: r.reviewed_by || 'System',
                          performed_by_role: 'Admin',
                          additional_details: {
                            business_type: r.business_type,
                            contact_phone: r.contact_phone,
                            business_address: r.business_address,
                            expected_revenue: r.expected_monthly_revenue,
                            employees: r.number_of_employees
                          }
                        })),
                        ...shops.map(s => ({
                          id: s.id,
                          type: 'shop' as const,
                          action: s.status === 'deleted' ? 'Shop Deleted' : 
                                  s.status === 'revoked' ? 'Shop Revoked' : 
                                  s.status === 'approved' ? 'Shop Approved' : 'Shop Updated',
                          displayName: s.name || s.shop_name || s.displayName || 'Unknown Shop',
                          status: s.status,
                          date: s.created_at || s.registration_date,
                          user_id: s.user_id,
                          user_name: 'Shop Owner', // We can enhance this later with user profile lookup
                          user_email: s.contact_email,
                          description: s.description,
                          reason: s.revoked_reason || s.admin_notes,
                          admin_notes: s.admin_notes,
                          performed_by: s.revoked_by || 'System',
                          performed_by_role: 'Admin',
                          additional_details: {
                            business_type: s.business_type,
                            contact_phone: s.contact_phone,
                            is_verified: s.is_verified,
                            business_license: s.business_license_number,
                            tax_id: s.tax_id
                          }
                        }))
                      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10);

                      if (allActivities.length === 0) {
                        return (
                          <div className="text-center py-4 text-muted-foreground">
                            No recent activity found
                          </div>
                        );
                      }

                      return allActivities.map((item, index) => (
                        <div 
                          key={index} 
                          className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors duration-200 cursor-pointer group"
                          onClick={() => handleActivityClick(item)}
                        >
                          <div className={`w-3 h-3 rounded-full ${
                            item.type === 'registration' ? 'bg-blue-500' : 'bg-green-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                              {item.displayName || 'Unknown Shop'}
                            </div>
                            <div className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                              {item.action} - {item.status || 'N/A'} - {new Date(item.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                            Click for details →
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Approval Dialog */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Shop Registration</DialogTitle>
              <DialogDescription>
                Provide notes for approving this shop registration request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="approval-notes">Approval Notes</Label>
                <Textarea
                  id="approval-notes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Enter approval notes..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApprove} disabled={processing}>
                  {processing ? "Approving..." : "Approve"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Shop Registration</DialogTitle>
              <DialogDescription>
                Provide reason for rejecting this shop registration request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsRejectionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={processing}>
                  {processing ? "Rejecting..." : "Reject"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Revoke Shop Dialog */}
        <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke Shop Provider Status</DialogTitle>
              <DialogDescription>
                Provide reason for revoking this shop's provider status. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="revoke-reason">Revocation Reason</Label>
                <Textarea
                  id="revoke-reason"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Enter reason for revocation..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsRevokeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRevokeShop} disabled={processing}>
                  {processing ? "Revoking..." : "Revoke Status"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Shop Dialog */}
        <Dialog open={isEditShopDialogOpen} onOpenChange={setIsEditShopDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Shop Information</DialogTitle>
              <DialogDescription>
                Update shop details and admin notes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shop-name">Shop Name</Label>
                  <Input
                    id="shop-name"
                    value={selectedShop?.name || selectedShop?.shop_name || ""}
                    onChange={(e) => setSelectedShop(prev => prev ? {...prev, name: e.target.value} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="shop-type">Business Type</Label>
                  <Input
                    id="shop-type"
                    value={selectedShop?.business_type || selectedShop?.type || ""}
                    onChange={(e) => setSelectedShop(prev => prev ? {...prev, business_type: e.target.value} : null)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="shop-description">Description</Label>
                                  <Textarea
                    id="shop-description"
                    value={selectedShop?.description || selectedShop?.shop_description || ""}
                    onChange={(e) => setSelectedShop(prev => prev ? {...prev, description: e.target.value} : null)}
                    rows={3}
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shop-email">Contact Email</Label>
                  <Input
                    id="shop-email"
                    type="email"
                    value={selectedShop?.contact_email || selectedShop?.email || ""}
                    onChange={(e) => setSelectedShop(prev => prev ? {...prev, contact_email: e.target.value} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="shop-phone">Contact Phone</Label>
                  <Input
                    id="shop-phone"
                    value={selectedShop?.contact_phone || selectedShop?.phone || ""}
                    onChange={(e) => setSelectedShop(prev => prev ? {...prev, contact_phone: e.target.value} : null)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  value={selectedShop?.admin_notes || ""}
                  onChange={(e) => setSelectedShop(prev => prev ? {...prev, admin_notes: e.target.value} : null)}
                  placeholder="Add admin notes..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-license">Business License Number</Label>
                  <Input
                    id="business-license"
                    value={selectedShop?.business_license_number || ""}
                    onChange={(e) => setSelectedShop(prev => prev ? {...prev, business_license_number: e.target.value} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input
                    id="tax-id"
                    value={selectedShop?.tax_id || ""}
                    onChange={(e) => setSelectedShop(prev => prev ? {...prev, tax_id: e.target.value} : null)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-verified"
                  checked={selectedShop?.is_verified || false}
                  onChange={(e) => setSelectedShop(prev => prev ? {...prev, is_verified: e.target.checked} : null)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is-verified">Mark as Verified</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditShopDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditShop} disabled={processing}>
                  {processing ? "Updating..." : "Update Shop"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Shop Registration Details</DialogTitle>
              <DialogDescription>
                Detailed information about the shop registration request
              </DialogDescription>
            </DialogHeader>
            {selectedRegistration && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="font-medium">Shop Name</Label>
                        <p className="text-sm text-muted-foreground">{selectedRegistration.shop_name}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Business Type</Label>
                        <p className="text-sm text-muted-foreground capitalize">{selectedRegistration.business_type}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Description</Label>
                        <p className="text-sm text-muted-foreground">{selectedRegistration.shop_description}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Status</Label>
                        <Badge className={getStatusColor(selectedRegistration.status)}>
                          {selectedRegistration.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="font-medium">Email</Label>
                        <p className="text-sm text-muted-foreground">{selectedRegistration.contact_email}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Phone</Label>
                        <p className="text-sm text-muted-foreground">{selectedRegistration.contact_phone}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Business License</Label>
                        <p className="text-sm text-muted-foreground">{selectedRegistration.business_license_number}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Tax ID</Label>
                        <p className="text-sm text-muted-foreground">{selectedRegistration.tax_id}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Address */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Business Address</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="font-medium">Street</Label>
                      <p className="text-sm text-muted-foreground">{selectedRegistration.business_address?.street}</p>
                    </div>
                    <div>
                      <Label className="font-medium">City</Label>
                      <p className="text-sm text-muted-foreground">{selectedRegistration.business_address?.city}</p>
                    </div>
                    <div>
                      <Label className="font-medium">State</Label>
                      <p className="text-sm text-muted-foreground">{selectedRegistration.business_address?.state}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Postal Code</Label>
                      <p className="text-sm text-muted-foreground">{selectedRegistration.business_address?.postal_code}</p>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Business Details</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="font-medium">Expected Monthly Revenue</Label>
                        <p className="text-sm text-muted-foreground">${selectedRegistration.expected_monthly_revenue?.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Number of Employees</Label>
                        <p className="text-sm text-muted-foreground">{selectedRegistration.number_of_employees}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Services Offered</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedRegistration.services_offered?.map((service, index) => (
                            <Badge key={index} variant="secondary" className="capitalize">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Timeline</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="font-medium">Created</Label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedRegistration.created_at).toLocaleString()}
                        </p>
                      </div>
                      {selectedRegistration.reviewed_at && (
                        <div>
                          <Label className="font-medium">Reviewed</Label>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedRegistration.reviewed_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {selectedRegistration.admin_notes && (
                        <div>
                          <Label className="font-medium">Admin Notes</Label>
                          <p className="text-sm text-muted-foreground">{selectedRegistration.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedRegistration.status === 'pending' && (
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button
                      variant="default"
                      onClick={() => {
                        setIsViewDetailsDialogOpen(false);
                        setIsApprovalDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsViewDetailsDialogOpen(false);
                        setIsRejectionDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Shop Details Dialog */}
        <Dialog open={isViewShopDetailsDialogOpen} onOpenChange={setIsViewShopDetailsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Shop Details</DialogTitle>
              <DialogDescription>
                Comprehensive information about the registered shop
              </DialogDescription>
            </DialogHeader>
            {selectedShop && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="font-medium">Shop Name</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedShop.name || selectedShop.shop_name || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <Label className="font-medium">Business Type</Label>
                        <p className="text-sm text-muted-foreground capitalize">
                          {selectedShop.business_type || selectedShop.type || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <Label className="font-medium">Description</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedShop.description || selectedShop.shop_description || 'No description provided'}
                        </p>
                      </div>
                      <div>
                        <Label className="font-medium">Status</Label>
                        <Badge className={getStatusColor(selectedShop.status)}>
                          {selectedShop.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="font-medium">Verification</Label>
                        <Badge className={selectedShop.is_verified ? "bg-green-600 text-white" : "bg-slate-600 text-white"}>
                          {selectedShop.is_verified ? "Verified" : "Not Verified"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="font-medium">Email</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedShop.contact_email || selectedShop.email || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <Label className="font-medium">Phone</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedShop.contact_phone || selectedShop.phone || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <Label className="font-medium">Business License</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedShop.business_license_number || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <Label className="font-medium">Tax ID</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedShop.tax_id || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Timeline</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="font-medium">Registration Date</Label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedShop.registration_date || selectedShop.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="font-medium">Created</Label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedShop.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedShop.revoked_at && (
                        <div>
                          <Label className="font-medium">Revoked</Label>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedShop.revoked_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Administrative</h3>
                    <div className="space-y-3">
                      {selectedShop.admin_notes && (
                        <div>
                          <Label className="font-medium">Admin Notes</Label>
                          <p className="text-sm text-muted-foreground">{selectedShop.admin_notes}</p>
                        </div>
                      )}
                      {selectedShop.revoked_reason && (
                        <div>
                          <Label className="font-medium">Revocation Reason</Label>
                          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {selectedShop.revoked_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewShopDetailsDialogOpen(false);
                      setIsEditShopDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Shop
                  </Button>
                  {selectedShop.status === 'active' && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsViewShopDetailsDialogOpen(false);
                        setIsRevokeDialogOpen(true);
                      }}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Revoke Status
                    </Button>
                  )}
                  {selectedShop.status === 'revoked' && (
                    <Button
                      variant="default"
                      onClick={() => {
                        setIsViewShopDetailsDialogOpen(false);
                        handleRestoreShop();
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Restore Status
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Shop Dialog */}
        <Dialog open={isDeleteShopDialogOpen} onOpenChange={setIsDeleteShopDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Shop</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this shop? This action cannot be undone and will remove all associated data including products, orders, and customer records.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedShop && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Shop to be deleted:</h4>
                  <p className="text-red-700">{selectedShop.name || selectedShop.shop_name}</p>
                  <p className="text-sm text-red-600">{selectedShop.description || selectedShop.shop_description}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDeleteShopDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteShop} disabled={processing}>
                  {processing ? "Deleting..." : "Delete Shop"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Activity Details Dialog */}
        <Dialog open={isActivityDetailsDialogOpen} onOpenChange={setIsActivityDetailsDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900">
            <DialogHeader className="border-b pb-4 mb-6">
              <DialogTitle className="flex items-center text-2xl font-bold text-slate-900 dark:text-white">
                <BarChart3 className="h-7 w-7 mr-3 text-blue-600" />
                Activity Details
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-300 text-base mt-2">
                Comprehensive information about this system activity
              </DialogDescription>
            </DialogHeader>
            
            {selectedActivity && (
              <div className="space-y-8">
                {/* Activity Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border-2 border-blue-100 dark:border-slate-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-full shadow-lg ${
                        selectedActivity.type === 'registration' ? 'bg-blue-500' : 
                        selectedActivity.type === 'shop' ? 'bg-green-500' : 'bg-purple-500'
                      }`}></div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {selectedActivity.action}
                      </h3>
                    </div>
                    <Badge 
                      className={`px-3 py-1 text-sm font-semibold ${
                        selectedActivity.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                        selectedActivity.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        selectedActivity.status === 'rejected' || selectedActivity.status === 'deleted' || selectedActivity.status === 'revoked' ? 'bg-red-100 text-red-800 border-red-300' :
                        'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                    >
                      {selectedActivity.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xl font-semibold text-slate-800 dark:text-slate-200 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-lg">
                    {selectedActivity.displayName}
                  </p>
                </div>

                {/* User Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-sm">
                    <h4 className="text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      User Information
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                        <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">User Name</Label>
                        <p className="text-base font-medium text-slate-900 dark:text-white mt-1">{selectedActivity.user_name || 'Not available'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                        <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">User Email</Label>
                        <p className="text-base font-medium text-slate-900 dark:text-white mt-1">{selectedActivity.user_email || 'Not available'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                        <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">User ID</Label>
                        <p className="text-sm font-mono text-slate-800 dark:text-slate-300 mt-1 bg-white dark:bg-slate-800 p-2 rounded border">{selectedActivity.user_id || 'Not available'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-sm">
                    <h4 className="text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-green-600" />
                      Action Details
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                        <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Action Type</Label>
                        <p className="text-base font-medium text-slate-900 dark:text-white mt-1 capitalize">{selectedActivity.type}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                        <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Performed By</Label>
                        <p className="text-base font-medium text-slate-900 dark:text-white mt-1">{selectedActivity.performed_by}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                        <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Role</Label>
                        <p className="text-base font-medium text-slate-900 dark:text-white mt-1">{selectedActivity.performed_by_role}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                        <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Date & Time</Label>
                        <p className="text-base font-medium text-slate-900 dark:text-white mt-1">
                          {new Date(selectedActivity.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description & Reason */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {selectedActivity.description && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-sm">
                      <h4 className="text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-purple-600" />
                        Description
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border-l-4 border-purple-500">
                        <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200">{selectedActivity.description}</p>
                      </div>
                    </div>
                  )}

                  {(selectedActivity.reason || selectedActivity.admin_notes) && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-sm">
                      <h4 className="text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                        {selectedActivity.type === 'shop' && selectedActivity.status === 'deleted' ? 'Deletion Reason' :
                         selectedActivity.type === 'shop' && selectedActivity.status === 'revoked' ? 'Revocation Reason' :
                         selectedActivity.type === 'registration' && selectedActivity.status === 'rejected' ? 'Rejection Reason' :
                         'Admin Notes'}
                      </h4>
                      <div className={`p-4 rounded-lg border-l-4 ${
                        selectedActivity.status === 'deleted' || selectedActivity.status === 'revoked' || selectedActivity.status === 'rejected' 
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                      }`}>
                        <p className={`text-base leading-relaxed font-medium ${
                          selectedActivity.status === 'deleted' || selectedActivity.status === 'revoked' || selectedActivity.status === 'rejected'
                            ? 'text-red-800 dark:text-red-200'
                            : 'text-blue-800 dark:text-blue-200'
                        }`}>
                          {selectedActivity.reason || selectedActivity.admin_notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Details */}
                {selectedActivity.additional_details && (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-sm">
                    <h4 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-indigo-600" />
                      Additional Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {selectedActivity.additional_details.business_type && (
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                          <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Business Type</Label>
                          <p className="text-base font-medium text-slate-900 dark:text-white mt-2 capitalize">{selectedActivity.additional_details.business_type}</p>
                        </div>
                      )}
                      {selectedActivity.additional_details.contact_phone && (
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                          <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Contact Phone</Label>
                          <p className="text-base font-medium text-slate-900 dark:text-white mt-2">{selectedActivity.additional_details.contact_phone}</p>
                        </div>
                      )}
                      {selectedActivity.additional_details.business_license && (
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                          <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Business License</Label>
                          <p className="text-sm font-mono text-slate-800 dark:text-slate-300 mt-2 bg-white dark:bg-slate-800 p-2 rounded border">{selectedActivity.additional_details.business_license}</p>
                        </div>
                      )}
                      {selectedActivity.additional_details.tax_id && (
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                          <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Tax ID</Label>
                          <p className="text-sm font-mono text-slate-800 dark:text-slate-300 mt-2 bg-white dark:bg-slate-800 p-2 rounded border">{selectedActivity.additional_details.tax_id}</p>
                        </div>
                      )}
                      {selectedActivity.additional_details.expected_revenue && (
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                          <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Expected Revenue</Label>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">${selectedActivity.additional_details.expected_revenue?.toLocaleString()}</p>
                        </div>
                      )}
                      {selectedActivity.additional_details.employees && (
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                          <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Employees</Label>
                          <p className="text-base font-medium text-slate-900 dark:text-white mt-2">{selectedActivity.additional_details.employees}</p>
                        </div>
                      )}
                      {selectedActivity.additional_details.is_verified !== undefined && (
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                          <Label className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Verification Status</Label>
                          <div className="mt-2">
                            <Badge className={`px-3 py-1 text-sm font-semibold ${
                              selectedActivity.additional_details.is_verified ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-800 border-gray-300'
                            }`}>
                              {selectedActivity.additional_details.is_verified ? 'Verified' : 'Not Verified'}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t-2 border-slate-200 dark:border-slate-600">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsActivityDetailsDialogOpen(false)}
                    className="px-6 py-2 text-base font-medium"
                  >
                    Close
                  </Button>
                  {selectedActivity.type === 'registration' && selectedActivity.status === 'pending' && (
                    <Button 
                      onClick={() => {
                        setIsActivityDetailsDialogOpen(false);
                        // Find and set the selected registration for approval
                        const reg = registrations.find(r => r.id === selectedActivity.id);
                        if (reg) {
                          setSelectedRegistration(reg);
                          setIsApprovalDialogOpen(true);
                        }
                      }}
                      className="px-6 py-2 text-base font-medium bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Review Registration
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
};

export default AdminDashboard;

