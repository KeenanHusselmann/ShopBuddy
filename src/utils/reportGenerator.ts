import jsPDF from 'jspdf';
import Papa from 'papaparse';
import { supabase } from "@/integrations/supabase/client";

import { ReportData as BaseReportData } from "@/types/common";

export type ReportData = BaseReportData;

export const generateCSVReport = (data: Record<string, unknown>[], filename: string): void => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generatePDFReport = (reportTitle: string, data: Record<string, unknown>[], filename: string): void => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(reportTitle, 20, 30);
  
  // Add date
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
  
  let yPosition = 60;
  
  if (data.length > 0) {
    // Add headers
    const headers = Object.keys(data[0]);
    doc.setFontSize(10);
    doc.text('Data Summary:', 20, yPosition);
    yPosition += 10;
    
    // Add sample data (first few rows)
    data.slice(0, 20).forEach((row, index) => {
      if (yPosition > 270) { // Start new page if needed
        doc.addPage();
        yPosition = 20;
      }
      
      const rowText = headers.map(header => `${header}: ${row[header] || 'N/A'}`).join(' | ');
      doc.text(rowText.substring(0, 180), 20, yPosition); // Truncate long text
      yPosition += 8;
    });
    
    if (data.length > 20) {
      yPosition += 10;
      doc.text(`... and ${data.length - 20} more records`, 20, yPosition);
    }
  }
  
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const saveReportRecord = async (reportName: string, reportType: 'csv' | 'pdf', filters: Record<string, unknown> = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("shop_id")
      .eq("id", user.id)
      .single();

    if (!profile?.shop_id) return;

    await supabase.from("reports").insert({
      shop_id: profile.shop_id,
      name: reportName,
      type: reportType,
      filters,
      generated_by: user.id
    });
  } catch (error) {
    console.error("Failed to save report record:", error);
  }
};