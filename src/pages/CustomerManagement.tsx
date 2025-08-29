import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle,
  LogOut,
  ArrowLeft,
  ShoppingBag,
  UserCheck,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Building2
} from 'lucide-react';
import { generateUUID } from '../utils/uuid';
import { copyToClipboard } from '../utils/clipboard';

interface CustomerInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  customer_type: string;
  phone?: string;
  status: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  invitation_token: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  customer_type: string;
  phone?: string;
  created_at: string;
  total_orders?: number;
  total_spent?: number;
}

const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  const [invitations, setInvitations] = useState<CustomerInvitation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shop, setShop] = useState<any>(null);

  // Form state for new customer invitation
  const [invitationForm, setInvitationForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    customer_type: 'retail',
    phone: '',
    date_of_birth: '',
    age_verified: false
  });

  // Form state for editing customer
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    customer_type: 'retail',
    phone: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/shop-owner-auth');
        return;
      }

      // Get user profile with shop details
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, shops(*)')
        .eq('id', user.id)
        .single();

      if (profile?.shops) {
        setShop(profile.shops);
        
        // Fetch customer invitations and customers
        const [invitationsRes, customersRes] = await Promise.all([
          supabase
            .from('shop_customer_invitations')
            .select('*')
            .eq('shop_id', profile.shops.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('customers')
            .select('*')
            .eq('shop_id', profile.shops.id)
            .order('created_at', { ascending: false })
        ]);

        setInvitations(invitationsRes.data || []);
        setCustomers(customersRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      if (!shop) throw new Error('Shop not found');

      // Age verification check
      if (!invitationForm.age_verified) {
        throw new Error('Age verification is required');
      }

      if (!invitationForm.date_of_birth) {
        throw new Error('Date of birth is required');
      }

      // Calculate age
      const birthDate = new Date(invitationForm.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        throw new Error('Customer must be 18 years or older');
      }

      const invitationToken = generateUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      const { data: invitation, error } = await supabase
        .from('shop_customer_invitations')
        .insert({
          shop_id: shop.id,
          email: invitationForm.email,
          first_name: invitationForm.first_name,
          last_name: invitationForm.last_name,
          customer_type: invitationForm.customer_type,
          phone: invitationForm.phone || null,
          date_of_birth: invitationForm.date_of_birth,
          age_verified: invitationForm.age_verified,
          invitation_token: invitationToken,
          status: 'pending',
          expires_at: expiresAt
        })
        .select()
        .single();

      if (error) throw error;

      // Generate invitation link
      const invitationLink = `${window.location.origin}/customer-invitation/${invitation.invitation_token}`;

      // Copy to clipboard
      const success = await copyToClipboard(invitationLink);
      if (success) {
        toast({
          title: 'Customer Invitation Created! 📧',
          description: 'Invitation link copied to clipboard'
        });
      } else {
        toast({
          title: 'Customer Invitation Created! 📧',
          description: `Copy this link: ${invitationLink}`
        });
      }

      // Reset form
      setInvitationForm({
        email: '',
        first_name: '',
        last_name: '',
        customer_type: 'retail',
        phone: '',
        date_of_birth: '',
        age_verified: false
      });

      // Refresh data
      fetchData();

    } catch (error: any) {
      console.error('Error inviting customer:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create invitation',
        description: error.message || 'An error occurred'
      });
    } finally {
      setInviting(false);
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          customer_type: editForm.customer_type,
          phone: editForm.phone || null
        })
        .eq('id', editingCustomer.id);

      if (error) throw error;

      toast({
        title: 'Customer Updated! ✅',
        description: 'Customer information has been updated successfully'
      });

      setEditingCustomer(null);
      setEditForm({
        first_name: '',
        last_name: '',
        customer_type: 'retail',
        phone: ''
      });

      fetchData();

    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update customer',
        description: error.message || 'An error occurred'
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('shop_customer_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: 'Invitation Cancelled',
        description: 'Customer invitation has been cancelled'
      });

      fetchData();
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to cancel invitation',
        description: error.message || 'An error occurred'
      });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: 'Customer Deleted',
        description: 'Customer has been removed from the system'
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete customer',
        description: error.message || 'An error occurred'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/shop-owner-auth');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/shop-owner-auth');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchTerm === '' || 
      customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || customer.customer_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 via-blue-600 to-indigo-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-lg text-white">Loading customer management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-600 to-indigo-400">
      {/* Header */}
      <header className="bg-blue-700/20 backdrop-blur-sm border-blue-400/30 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-white">Customer Management</h1>
                <p className="text-sm text-blue-100">Manage your shop customers</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white"
                onClick={() => navigate('/shop-owner-dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Customer Management
          </h1>
          <p className="text-blue-100">
            Invite new customers and manage existing customer accounts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invite New Customer */}
          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <span>Invite New Customer</span>
              </CardTitle>
              <CardDescription className="text-blue-600">
                Create customer invitations. Customers will receive a link to set up their account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteCustomer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-blue-800">First Name *</Label>
                    <Input
                      id="first_name"
                      value={invitationForm.first_name}
                      onChange={(e) => setInvitationForm(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Enter first name"
                      required
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-blue-800">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={invitationForm.last_name}
                      onChange={(e) => setInvitationForm(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Enter last name"
                      required
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-800">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={invitationForm.email}
                    onChange={(e) => setInvitationForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="customer@example.com"
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-blue-800">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={invitationForm.phone}
                      onChange={(e) => setInvitationForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+264 61 123 4567"
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer_type" className="text-blue-800">Customer Type *</Label>
                    <Select
                      value={invitationForm.customer_type}
                      onValueChange={(value) => setInvitationForm(prev => ({ ...prev, customer_type: value }))}
                    >
                      <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail Customer</SelectItem>
                        <SelectItem value="vip">VIP Customer</SelectItem>
                        <SelectItem value="wholesale">Wholesale Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth" className="text-blue-800">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={invitationForm.date_of_birth}
                      onChange={(e) => setInvitationForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      required
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age_verified" className="text-blue-800">Age Verification *</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        id="age_verified"
                        type="checkbox"
                        checked={invitationForm.age_verified}
                        onChange={(e) => setInvitationForm(prev => ({ ...prev, age_verified: e.target.checked }))}
                        required
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                      />
                      <Label htmlFor="age_verified" className="text-sm text-blue-700">
                        I confirm this customer is 18 years or older
                      </Label>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={inviting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {inviting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {inviting ? "Creating Invitation..." : "Create Customer Invitation"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50">
              <CardHeader>
                <CardTitle className="text-blue-800">Customer Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{customers.length}</div>
                    <p className="text-sm text-blue-600">Total Customers</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {invitations.filter(inv => inv.status === 'pending').length}
                    </div>
                    <p className="text-sm text-blue-600">Pending Invitations</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-semibold text-blue-700">
                      {customers.filter(c => c.customer_type === 'regular').length}
                    </div>
                    <p className="text-xs text-blue-600">Regular</p>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-700">
                      {customers.filter(c => c.customer_type === 'vip').length}
                    </div>
                    <p className="text-xs text-blue-600">VIP</p>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-700">
                      {customers.filter(c => c.customer_type === 'wholesale').length}
                    </div>
                    <p className="text-xs text-blue-600">Wholesale</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pending Customer Invitations */}
        {invitations.filter(inv => inv.status === 'pending').length > 0 && (
          <Card className="mt-8 bg-white/90 backdrop-blur-sm border-blue-300/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Pending Customer Invitations</span>
              </CardTitle>
              <CardDescription className="text-blue-600">
                Customer invitations waiting for acceptance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invitations
                  .filter(inv => inv.status === 'pending')
                  .map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-medium text-blue-800">
                            {invitation.first_name} {invitation.last_name}
                          </div>
                          <div className="text-sm text-blue-600">
                            {invitation.email} • {invitation.customer_type}
                          </div>
                          <div className="text-xs text-blue-500">
                            Invited {new Date(invitation.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                          onClick={async () => {
                            const link = `${window.location.origin}/customer-invitation/${invitation.invitation_token}`;
                            const success = await copyToClipboard(link);
                            
                            if (success) {
                              toast({
                                title: "Link Copied! 📋",
                                description: "Invitation link copied to clipboard"
                              });
                            } else {
                              toast({
                                title: "Copy This Link",
                                description: link,
                                duration: 10000,
                              });
                            }
                          }}
                        >
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Customers */}
        <Card className="mt-8 bg-white/90 backdrop-blur-sm border-blue-300/50">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Current Customers</span>
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Manage your registered customers
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400 w-64"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 w-40">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-blue-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No customers found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium text-blue-800">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-sm text-blue-600">
                          {customer.email} • {customer.customer_type}
                        </div>
                        <div className="text-xs text-blue-500">
                          Joined {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                        onClick={() => {
                          setEditingCustomer(customer);
                          setEditForm({
                            first_name: customer.first_name,
                            last_name: customer.last_name,
                            customer_type: customer.customer_type,
                            phone: customer.phone || ''
                          });
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
                        onClick={() => handleDeleteCustomer(customer.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Edit Customer</h3>
            <form onSubmit={handleEditCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name" className="text-blue-800">First Name</Label>
                  <Input
                    id="edit_first_name"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name" className="text-blue-800">Last Name</Label>
                  <Input
                    id="edit_last_name"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_phone" className="text-blue-800">Phone</Label>
                  <Input
                    id="edit_phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_customer_type" className="text-blue-800">Customer Type</Label>
                  <Select
                    value={editForm.customer_type}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, customer_type: value }))}
                  >
                    <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Update Customer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingCustomer(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
