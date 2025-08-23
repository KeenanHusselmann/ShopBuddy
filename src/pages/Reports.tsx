import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { HeaderWithNav } from "@/components/common/HeaderWithNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { generateCSVReport, generatePDFReport, saveReportRecord } from "@/utils/reportGenerator";
import { logAuditEvent } from "@/utils/auditLogger";
import { 
  FileText, 
  Download, 
  Calendar,
  Filter,
  BarChart3
} from "lucide-react";

const Reports = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<string>("");
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({});
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*, shops(name)")
      .eq("id", user.id)
      .single();

    setProfile(profileData);
  };

  const generateReport = async () => {
    if (!reportType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a report type"
      });
      return;
    }

    setLoading(true);
    try {
      let data: any[] = [];
      let reportTitle = "";
      let filename = "";

      const dateFilter = dateRange.from ? 
        { gte: dateRange.from.toISOString() } : 
        {};
      const endDateFilter = dateRange.to ? 
        { lte: dateRange.to.toISOString() } : 
        {};

      switch (reportType) {
        case 'orders':
          const { data: ordersData } = await supabase
            .from("orders")
            .select(`
              id,
              order_number,
              status,
              total_amount,
              currency,
              created_at,
              customers(first_name, last_name, email)
            `)
            .eq("shop_id", profile.shop_id)
            .gte("created_at", dateFilter.gte || "2000-01-01")
            .lte("created_at", endDateFilter.lte || "2099-12-31");

          data = ordersData || [];
          reportTitle = "Orders Report";
          filename = "orders_report";
          break;

        case 'customers':
          const { data: customersData } = await supabase
            .from("customers")
            .select("*")
            .eq("shop_id", profile.shop_id)
            .gte("created_at", dateFilter.gte || "2000-01-01")
            .lte("created_at", endDateFilter.lte || "2099-12-31");

          data = customersData || [];
          reportTitle = "Customers Report";
          filename = "customers_report";
          break;

        case 'products':
          const { data: productsData } = await supabase
            .from("products")
            .select("*")
            .eq("shop_id", profile.shop_id);

          data = productsData || [];
          reportTitle = "Products Report";
          filename = "products_report";
          break;

        case 'audit':
          if (profile.role !== 'shop_admin') {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "Only shop owners can generate audit reports"
            });
            return;
          }

          const { data: auditData } = await supabase
            .from("audit_logs")
            .select("*")
            .eq("shop_id", profile.shop_id)
            .gte("created_at", dateFilter.gte || "2000-01-01")
            .lte("created_at", endDateFilter.lte || "2099-12-31")
            .order("created_at", { ascending: false });

          data = auditData || [];
          reportTitle = "Audit Trail Report";
          filename = "audit_report";
          break;

        default:
          throw new Error("Invalid report type");
      }

      // Generate report
      if (format === 'csv') {
        generateCSVReport(data, filename);
      } else {
        generatePDFReport(reportTitle, data, filename);
      }

      // Save report record
      await saveReportRecord(reportTitle, format, { 
        dateRange, 
        recordCount: data.length 
      });

      // Log audit event
      await logAuditEvent({
        action: `Generated ${format.toUpperCase()} report: ${reportTitle}`,
        metadata: { 
          reportType, 
          format, 
          recordCount: data.length,
          dateRange 
        }
      });

      toast({
        title: "Success",
        description: `${reportTitle} generated successfully (${data.length} records)`
      });

    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate report"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requiredRole={['shop_admin', 'staff', 'super_admin']}>
      <div className="min-h-screen bg-background">
        <HeaderWithNav title="Generate Reports" profile={profile} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Generate Reports
            </h1>
            <p className="text-muted-foreground">
              Create detailed reports for your business analysis
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Report Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Report Configuration</span>
                </CardTitle>
                <CardDescription>
                  Select report type and date range
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Report Type
                  </label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orders">Orders Report</SelectItem>
                      <SelectItem value="customers">Customers Report</SelectItem>
                      <SelectItem value="products">Products Report</SelectItem>
                      {profile?.role === 'shop_admin' && (
                        <SelectItem value="audit">Audit Trail Report</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Format
                  </label>
                  <Select value={format} onValueChange={(value: 'csv' | 'pdf') => setFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      From Date
                    </label>
                    <DatePicker
                      date={dateRange.from}
                      onDateChange={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      To Date
                    </label>
                    <DatePicker
                      date={dateRange.to}
                      onDateChange={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={generateReport} 
                  className="w-full" 
                  disabled={loading || !reportType}
                  variant="premium"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? "Generating..." : `Generate ${format.toUpperCase()} Report`}
                </Button>
              </CardContent>
            </Card>

            {/* Report Types Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Available Reports</span>
                </CardTitle>
                <CardDescription>
                  Information about each report type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-foreground">Orders Report</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete order history with customer details, amounts, and status
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-foreground">Customers Report</h4>
                  <p className="text-sm text-muted-foreground">
                    Customer database with contact info, order history, and debt status
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-foreground">Products Report</h4>
                  <p className="text-sm text-muted-foreground">
                    Inventory levels, pricing, and product performance
                  </p>
                </div>

                {profile?.role === 'shop_admin' && (
                  <div className="p-4 border rounded-lg border-primary bg-primary/5">
                    <h4 className="font-semibold text-foreground">Audit Trail Report</h4>
                    <p className="text-sm text-muted-foreground">
                      Staff activity log showing who did what and when (Owner only)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Reports;