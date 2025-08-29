import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Auth from "./pages/Auth";

import CustomerPortal from "./pages/CustomerPortal";
import Reports from "./pages/Reports";
import ShopRegistration from "./pages/ShopRegistration";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminLogin from "./pages/AdminLogin";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import StaffManagement from "./pages/StaffManagement";
import StaffInvitation from "./pages/StaffInvitation";
import StaffDashboard from "./pages/StaffDashboard";
import CustomerSignup from "./pages/CustomerSignup";
import SuperAdminAuth from "./pages/SuperAdminAuth";
import ShopOwnerAuth from "./pages/ShopOwnerAuth";
import ShopOwnerDashboard from "./pages/ShopOwnerDashboard";
import ShopOwnerPOS from "./pages/ShopOwnerPOS";
import ShopOwnerAnalytics from "./pages/ShopOwnerAnalytics";
import ShopOwnerProducts from "./pages/ShopOwnerProducts";
import ShopOwnerOrders from "./pages/ShopOwnerOrders";
import StaffActivity from './pages/StaffActivity';
import CustomerManagement from "./pages/CustomerManagement";
import StaffAuth from "./pages/StaffAuth";
import CustomerAuth from "./pages/CustomerAuth";
import ShopStaffAuth from "./pages/ShopStaffAuth";
import ShopStaffDashboard from "./pages/ShopStaffDashboard";
import StaffPOS from "./pages/StaffPOS";
import ShopCustomerInvitation from "./pages/ShopCustomerInvitation";
import ShopCustomerAuth from "./pages/ShopCustomerAuth";
import ShopCustomerDashboard from "./pages/ShopCustomerDashboard";
import CustomerProducts from "./pages/CustomerProducts";
import CustomerCart from "./pages/CustomerCart";
import CustomerOrders from "./pages/CustomerOrders";
import PasswordReset from "./pages/PasswordReset";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Navigate to="/shop-owner-dashboard" replace />} />
          <Route path="/shop-registration" element={<ShopRegistration />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/customer-portal" element={<CustomerPortal />} />
          <Route path="/staff-management" element={<StaffManagement />} />
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
          <Route path="/customer-signup" element={<CustomerSignup />} />
          
          {/* Super Admin routes - only accessible via direct URL */}
          <Route path="/super-admin-auth" element={<SuperAdminAuth />} />
          
          {/* Individual authentication routes */}
          <Route path="/shop-owner-auth" element={<ShopOwnerAuth />} />
          <Route path="/shop-owner-dashboard" element={<ShopOwnerDashboard />} />
          <Route path="/shop/:shopId/shop-owner-pos" element={<ShopOwnerPOS />} />
          <Route path="/shop-owner-analytics" element={<ShopOwnerAnalytics />} />
          <Route path="/shop-owner-products" element={<ShopOwnerProducts />} />
          <Route path="/staff-activity" element={<StaffActivity />} />
          <Route path="/customer-management" element={<CustomerManagement />} />
          <Route path="/staff-auth" element={<StaffAuth />} />
          <Route path="/customer-auth" element={<CustomerAuth />} />
          
          {/* Password reset */}
          <Route path="/password-reset" element={<PasswordReset />} />
          
          {/* Invitation routes */}
          <Route path="/staff-invitation/:token" element={<StaffInvitation />} />
          <Route path="/customer-invitation/:token" element={<ShopCustomerInvitation />} />
          
          {/* Shop-specific routes */}
          <Route path="/shop/:shopId/staff-auth" element={<ShopStaffAuth />} />
          <Route path="/shop/:shopId/staff-dashboard" element={<ShopStaffDashboard />} />
          <Route path="/shop/:shopId/customer-dashboard" element={<ShopCustomerDashboard />} />
          <Route path="/shop/:shopId/customer-products" element={<CustomerProducts />} />
          <Route path="/shop/:shopId/customer-cart" element={<CustomerCart />} />
          <Route path="/shop/:shopId/customer-orders" element={<CustomerOrders />} />
          <Route path="/shop/:shopId/staff-pos" element={<StaffPOS />} />
          <Route path="/shop/:shopId/shop-owner-orders" element={<ShopOwnerOrders />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
