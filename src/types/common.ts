import { Database } from "@/integrations/supabase/types";

// Common types for the application
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Shop = Database["public"]["Tables"]["shops"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type Inventory = Database["public"]["Tables"]["inventory"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];

// Extended types with additional properties
export interface ExtendedProfile extends Profile {
  shop?: Shop;
}

export interface ExtendedProduct extends Product {
  category?: Category;
  inventory?: Inventory[];
}

export interface ExtendedOrder extends Order {
  customer?: Customer;
  items?: OrderItem[];
}

export interface ExtendedCustomer extends Customer {
  orders?: Order[];
}

// Form data types
export interface FormData {
  [key: string]: string | number | boolean | null | undefined;
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string | null;
  success: boolean;
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

// Filter types
export interface DateRange {
  from: Date;
  to: Date;
}

export interface TableFilters {
  search?: string;
  status?: string;
  category?: string;
  dateRange?: DateRange;
  page?: number;
  limit?: number;
}

// Event types
export interface AuditEvent {
  action: string;
  metadata?: Record<string, unknown>;
  tableName?: string;
  recordId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

// Report types
export interface ReportFilters {
  dateRange?: DateRange;
  status?: string;
  category?: string;
  [key: string]: unknown;
}

export interface ReportData {
  orders?: ExtendedOrder[];
  customers?: ExtendedCustomer[];
  products?: ExtendedProduct[];
  analytics?: ChartData;
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

// Toast types
export interface ToastData {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
}

// User context types
export interface UserContextType {
  user: unknown; // Supabase user
  profile: ExtendedProfile | null;
  shop: Shop | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
