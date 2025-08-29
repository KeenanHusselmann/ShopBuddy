import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Store,
  User,
  LogOut,
  Settings,
  BarChart3,
  Package,
  Users,
  ShoppingCart,
  Crown,
  Building2,
  UserCheck,
  ShoppingBag,
  Heart,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ExtendedProfile } from "@/types/common";

interface HeaderWithNavProps {
  title: string;
  user?: ExtendedProfile;
  onSignOut?: () => void;
}

const HeaderWithNav = ({ title, user, onSignOut }: HeaderWithNavProps) => {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      if (onSignOut) {
        onSignOut();
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Administrator";
      case "shop_admin":
        return "Shop Owner";
      case "staff":
        return "Staff Member";
      case "customer":
        return "Customer";
      default:
        return "User";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Crown className="h-4 w-4" />;
      case "shop_admin":
        return <Building2 className="h-4 w-4" />;
      case "staff":
        return <UserCheck className="h-4 w-4" />;
      case "customer":
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => {
                // Navigate based on user role
                if (user?.role === "super_admin") {
                  navigate("/admin"); // Admin users go to admin dashboard
                } else if (user?.role === "shop_admin" || user?.role === "staff") {
                  navigate("/shop-owner-dashboard"); // Shop users go to shop dashboard
                } else if (user?.role === "customer") {
                  navigate("/customer-portal"); // Customers go to customer portal
                } else {
                  navigate("/"); // Default to home page for non-authenticated users
                }
              }}
              className="p-0 h-auto hover:bg-transparent"
            >
              <div className="flex items-center space-x-2">
                <Store className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {title}
                </span>
              </div>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {user && (
              <>

                
                {(user.role === "shop_admin" || user.role === "staff") && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/shop-owner-dashboard")}
                      className="flex items-center space-x-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/products")}
                      className="flex items-center space-x-2"
                    >
                      <Package className="h-4 w-4" />
                      <span>Products</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/customers")}
                      className="flex items-center space-x-2"
                    >
                      <Users className="h-4 w-4" />
                      <span>Customers</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/orders")}
                      className="flex items-center space-x-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Orders</span>
                    </Button>
                    {user.role === "shop_admin" && (
                      <Button
                        variant="ghost"
                        onClick={() => navigate("/staff-management")}
                        className="flex items-center space-x-2"
                      >
                        <Users className="h-4 w-4" />
                        <span>Staff</span>
                      </Button>
                    )}
                  </>
                )}

                {user.role === "customer" && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/customer-portal")}
                      className="flex items-center space-x-2"
                    >
                      <Heart className="h-4 w-4" />
                      <span>My Account</span>
                    </Button>
                  </>
                )}
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} alt={user.first_name} />
                      <AvatarFallback>
                        {getInitials(user.first_name, user.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getRoleIcon(user.role)}
                        <span className="text-xs text-muted-foreground">
                          {getRoleDisplayName(user.role)}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Role-specific actions */}

                  
                  {(user.role === "shop_admin" || user.role === "staff") && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/shop-owner-dashboard")}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/products")}>
                        <Package className="mr-2 h-4 w-4" />
                        <span>Products</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/customers")}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Customers</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/orders")}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>Orders</span>
                      </DropdownMenuItem>
                      {user.role === "shop_admin" && (
                        <DropdownMenuItem onClick={() => navigate("/staff-management")}>
                          <Users className="mr-2 h-4 w-4" />
                          <span>Manage Staff</span>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  {user.role === "customer" && (
                    <DropdownMenuItem onClick={() => navigate("/customer-portal")}>
                      <Heart className="mr-2 h-4 w-4" />
                      <span>My Account</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                  className="flex items-center space-x-2"
                >
                  <Shield className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
                <Button
                  onClick={() => navigate("/auth")}
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Get Started</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export { HeaderWithNav };