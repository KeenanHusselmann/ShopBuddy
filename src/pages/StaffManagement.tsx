import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle,
  Store,
  LogOut,
  ArrowLeft
} from "lucide-react";
import { HeaderWithNav } from "@/components/common/HeaderWithNav";
import { AuthGuard } from "@/components/auth/AuthGuard";

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
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
}

const StaffManagement = () => {
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state for new invitation
  const [invitationForm, setInvitationForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "staff",
    permissions: {}
  });

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile with shop details
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, shops(*)")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      setShop(profileData?.shops);

      if (profileData?.shop_id) {
        // Fetch staff invitations and members
        const [invitationsRes, staffRes] = await Promise.all([
          supabase
            .from("staff_invitations")
            .select("*")
            .eq("shop_id", profileData.shop_id)
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("id, first_name, last_name, email, role, created_at")
            .eq("shop_id", profileData.shop_id)
            .eq("role", "staff")
            .order("created_at", { ascending: false })
        ]);

        setInvitations(invitationsRes.data || []);
        setStaffMembers(staffRes.data || []);
      }
    } catch (error) {
      console.error("Error fetching staff data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load staff data"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      const { data, error } = await supabase.rpc('invite_staff_member', {
        shop_id_param: profile.shop_id,
        email_param: invitationForm.email,
        first_name_param: invitationForm.first_name,
        last_name_param: invitationForm.last_name,
        role_param: invitationForm.role,
        permissions_param: invitationForm.permissions
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: `Staff invitation sent to ${invitationForm.email}`
        });

        // Reset form
        setInvitationForm({
          email: "",
          first_name: "",
          last_name: "",
          role: "staff",
          permissions: {}
        });

        // Refresh data
        fetchStaffData();
      } else {
        throw new Error(data.error || "Failed to send invitation");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("staff_invitations")
        .update({ status: 'cancelled' })
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation cancelled successfully"
      });

      fetchStaffData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel invitation"
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out"
      });
    } else {
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userProfile = {
    first_name: profile?.first_name || "User",
    last_name: profile?.last_name || "",
    email: profile?.email || "",
    role: profile?.role || "shop_admin",
    avatar_url: profile?.avatar_url || null
  };

  return (
    <AuthGuard requiredRole={['shop_admin']}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <HeaderWithNav 
          title="ShopBuddy" 
          user={userProfile}
          onSignOut={handleSignOut}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Staff Management 🇳🇦
            </h1>
            <p className="text-muted-foreground">
              Invite and manage your shop staff members
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Invite New Staff */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Invite New Staff</span>
                </CardTitle>
                <CardDescription>
                  Send invitations to new staff members. They'll receive an email with login credentials.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInviteStaff} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        value={invitationForm.first_name}
                        onChange={(e) => setInvitationForm(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        value={invitationForm.last_name}
                        onChange={(e) => setInvitationForm(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={invitationForm.email}
                      onChange={(e) => setInvitationForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="staff@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={invitationForm.role}
                      onValueChange={(value) => setInvitationForm(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff Member</SelectItem>
                        <SelectItem value="assistant_manager">Assistant Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={inviting}
                    className="w-full"
                  >
                    {inviting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    {inviting ? "Sending Invitation..." : "Send Invitation"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Staff Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Staff Overview</span>
                </CardTitle>
                <CardDescription>
                  Current staff members and pending invitations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{staffMembers.length}</div>
                    <div className="text-sm text-muted-foreground">Active Staff</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-100 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {invitations.filter(inv => inv.status === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending Invitations</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Invitations */}
          {invitations.filter(inv => inv.status === 'pending').length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Pending Invitations</span>
                </CardTitle>
                <CardDescription>
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
                            <div className="font-medium">
                              {invitation.first_name} {invitation.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {invitation.email} • {invitation.role}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Invited {new Date(invitation.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
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
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Current Staff Members</span>
              </CardTitle>
              <CardDescription>
                Active staff members in your shop
              </CardDescription>
            </CardHeader>
            <CardContent>
              {staffMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No staff members yet. Invite your first staff member above!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {staffMembers.map((staff) => (
                    <div key={staff.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-medium">
                            {staff.first_name} {staff.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {staff.email} • {staff.role}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Joined {new Date(staff.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
};

export default StaffManagement;
