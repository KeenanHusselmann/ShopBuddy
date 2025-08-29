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

interface StaffInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  invitation_token: string;
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
}

const StaffManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [shop, setShop] = useState<any>(null);

  // Form state for new staff invitation
  const [invitationForm, setInvitationForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'staff',
    phone: ''
  });

  // Form state for editing staff
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    role: 'staff'
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
        
        // Fetch staff invitations and staff members
        const [invitationsRes, staffRes] = await Promise.all([
          supabase
            .from('shop_staff_invitations')
            .select('*')
            .eq('shop_id', profile.shops.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('profiles')
            .select('*')
            .eq('shop_id', profile.shops.id)
            .eq('role', 'staff')
            .order('created_at', { ascending: false })
        ]);

        setInvitations(invitationsRes.data || []);
        setStaffMembers(staffRes.data || []);
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

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      if (!shop) throw new Error('Shop not found');

      const invitationToken = generateUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      const { data: invitation, error } = await supabase
        .from('shop_staff_invitations')
        .insert({
          shop_id: shop.id,
          email: invitationForm.email,
          first_name: invitationForm.first_name,
          last_name: invitationForm.last_name,
          role: invitationForm.role,
          invitation_token: invitationToken,
          status: 'pending',
          expires_at: expiresAt
        })
        .select()
        .single();

      if (error) throw error;

      // Generate invitation link
      const invitationLink = `${window.location.origin}/staff-invitation/${invitation.invitation_token}`;

      // Copy to clipboard
      const success = await copyToClipboard(invitationLink);
      if (success) {
        toast({
          title: 'Staff Invitation Created! 📧',
          description: 'Invitation link copied to clipboard'
        });
      } else {
        toast({
          title: 'Staff Invitation Created! 📧',
          description: `Copy this link: ${invitationLink}`
        });
      }

      // Reset form
      setInvitationForm({
        email: '',
        first_name: '',
        last_name: '',
        role: 'staff',
        phone: ''
      });

      // Refresh data
      fetchData();

    } catch (error: any) {
      console.error('Error inviting staff:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create invitation',
        description: error.message || 'An error occurred'
      });
    } finally {
      setInviting(false);
    }
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          role: editForm.role
        })
        .eq('id', editingStaff.id);

      if (error) throw error;

      toast({
        title: 'Staff Updated! ✅',
        description: 'Staff information has been updated successfully'
      });

      setEditingStaff(null);
      setEditForm({
        first_name: '',
        last_name: '',
        role: 'staff'
      });

      fetchData();

    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update staff',
        description: error.message || 'An error occurred'
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('shop_staff_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: 'Invitation Cancelled',
        description: 'Staff invitation has been cancelled'
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

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: 'Staff Removed',
        description: 'Staff member has been removed from the system'
      });

      fetchData();
    } catch (error: any) {
      console.error('Error removing staff:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to remove staff',
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

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = searchTerm === '' || 
      staff.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || staff.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 via-blue-600 to-indigo-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-lg text-white">Loading staff management...</p>
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
                <h1 className="text-2xl font-bold text-white">Staff Management</h1>
                <p className="text-sm text-blue-100">Manage your shop staff</p>
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
            Staff Management
          </h1>
          <p className="text-blue-100">
            Invite new staff members and manage existing staff accounts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invite New Staff */}
          <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <span>Invite New Staff</span>
              </CardTitle>
              <CardDescription className="text-blue-600">
                Create staff invitations. Staff members will receive a link to set up their account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteStaff} className="space-y-4">
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
                    placeholder="staff@example.com"
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-blue-800">Role *</Label>
                  <Select
                    value={invitationForm.role}
                    onValueChange={(value) => setInvitationForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff Member</SelectItem>
                      <SelectItem value="assistant_manager">Assistant Manager</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
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
                  {inviting ? "Creating Invitation..." : "Create Staff Invitation"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-blue-300/50">
              <CardHeader>
                <CardTitle className="text-blue-800">Staff Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{staffMembers.length}</div>
                    <p className="text-sm text-blue-600">Active Staff</p>
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
                      {staffMembers.filter(s => s.role === 'staff').length}
                    </div>
                    <p className="text-xs text-blue-600">Staff</p>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-700">
                      {staffMembers.filter(s => s.role === 'assistant_manager').length}
                    </div>
                    <p className="text-xs text-blue-600">Managers</p>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-700">
                      {staffMembers.filter(s => s.role === 'supervisor').length}
                    </div>
                    <p className="text-xs text-blue-600">Supervisors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pending Staff Invitations */}
        {invitations.filter(inv => inv.status === 'pending').length > 0 && (
          <Card className="mt-8 bg-white/90 backdrop-blur-sm border-blue-300/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Pending Staff Invitations</span>
              </CardTitle>
              <CardDescription className="text-blue-600">
                Staff invitations waiting for acceptance
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
                            {invitation.email} • {invitation.role}
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
                            const link = `${window.location.origin}/staff-invitation/${invitation.invitation_token}`;
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

        {/* Current Staff Members */}
        <Card className="mt-8 bg-white/90 backdrop-blur-sm border-blue-300/50">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Current Staff Members</span>
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Manage your active staff members
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                  <Input
                    placeholder="Search staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400 w-64"
                  />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="assistant_manager">Managers</SelectItem>
                    <SelectItem value="supervisor">Supervisors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStaff.length === 0 ? (
              <div className="text-center py-8 text-blue-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No staff members found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStaff.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium text-blue-800">
                          {staff.first_name} {staff.last_name}
                        </div>
                        <div className="text-sm text-blue-600">
                          {staff.email} • {staff.role}
                        </div>
                        <div className="text-xs text-blue-500">
                          Joined {new Date(staff.created_at).toLocaleDateString()}
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
                          setEditingStaff(staff);
                          setEditForm({
                            first_name: staff.first_name,
                            last_name: staff.last_name,
                            role: staff.role
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
                        onClick={() => handleDeleteStaff(staff.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Edit Staff Member</h3>
            <form onSubmit={handleEditStaff} className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="edit_role" className="text-blue-800">Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff Member</SelectItem>
                    <SelectItem value="assistant_manager">Assistant Manager</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Update Staff
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingStaff(null)}
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

export default StaffManagement;
