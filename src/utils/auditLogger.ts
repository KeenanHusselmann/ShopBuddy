import { supabase } from "@/integrations/supabase/client";

import { AuditEvent } from "@/types/common";

interface AuditLogData {
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export const logAuditEvent = async (data: AuditLogData) => {
  try {
    // Get current user and profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("shop_id, first_name, last_name, role")
      .eq("id", user.id)
      .single();

    if (!profile?.shop_id) return;

    const auditData = {
      shop_id: profile.shop_id,
      user_id: user.id,
      user_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User',
      user_role: profile.role,
      action: data.action,
      table_name: data.table_name,
      record_id: data.record_id,
      old_values: data.old_values,
      new_values: data.new_values,
      metadata: data.metadata || {},
      ip_address: null, // Could be captured from client if needed
      user_agent: navigator.userAgent
    };

    await supabase.from("audit_logs").insert(auditData);
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Don't throw error to avoid breaking main operations
  }
};