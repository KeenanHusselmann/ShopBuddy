import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import PointOfSale from "./pages/PointOfSale";
import Analytics from "./pages/Analytics";
import CustomerPortal from "./pages/CustomerPortal";
import Reports from "./pages/Reports";
import ShopRegistration from "./pages/ShopRegistration";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminLogin from "./pages/AdminLogin";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import StaffManagement from "./pages/StaffManagement";
import CustomerSignup from "./pages/CustomerSignup";
import SuperAdminAuth from "./pages/SuperAdminAuth";
import ShopOwnerAuth from "./pages/ShopOwnerAuth";
import StaffAuth from "./pages/StaffAuth";
import CustomerAuth from "./pages/CustomerAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shop-registration" element={<ShopRegistration />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/pos" element={<PointOfSale />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/customer-portal" element={<CustomerPortal />} />
          <Route path="/staff-management" element={<StaffManagement />} />
          <Route path="/customer-signup" element={<CustomerSignup />} />
          <Route path="/super-admin-auth" element={<SuperAdminAuth />} />
          <Route path="/shop-owner-auth" element={<ShopOwnerAuth />} />
          <Route path="/staff-auth" element={<StaffAuth />} />
          <Route path="/customer-auth" element={<CustomerAuth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
