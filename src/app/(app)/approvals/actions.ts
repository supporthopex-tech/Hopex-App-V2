"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAnyPermission, isSupabaseConfigured } from "@/lib/tenant";

type MutationClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
    update: (payload: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
    insert: (payload: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
};

export async function decideStaffApproval(formData: FormData) {
  const tenant = await requireAnyPermission(["approvals.manage", "staff.edit"]);
  const approvalId = String(formData.get("approval_id") ?? "");
  const staffId = String(formData.get("staff_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!approvalId || !staffId || !["approved", "rejected"].includes(decision)) return;

  if (!isSupabaseConfigured()) {
    revalidatePath("/approvals");
    return;
  }

  const supabase = (await createClient()) as unknown as MutationClient;
  const now = new Date().toISOString();
  const staff = await supabase.from("staff").select("user_id").eq("id", staffId).single();
  const staffUserId = staff.data?.user_id ? String(staff.data.user_id) : "";
  await supabase.from("approvals").update({
    status: decision,
    decided_by: tenant.user.id,
    decided_at: now,
    comments: [{ message: reason || `Staff account ${decision}.`, at: now }],
  }).eq("id", approvalId);

  await supabase.from("staff").update(decision === "approved" ? {
    status: "active",
    account_status: "active",
    approved_by: tenant.user.id,
    approved_at: now,
    rejection_reason: null,
  } : {
    status: "rejected",
    account_status: "rejected",
    rejected_by: tenant.user.id,
    rejected_at: now,
    rejection_reason: reason,
  }).eq("id", staffId);

  if (staffUserId) {
    await supabase.from("company_users").update({
      status: decision === "approved" ? "active" : "suspended",
    }).eq("user_id", staffUserId);
  }

  await supabase.from("approval_history").insert({
    company_id: tenant.company.id,
    approval_id: approvalId,
    staff_id: staffId,
    action: decision,
    reason,
    actor_id: tenant.user.id,
    created_by: tenant.user.id,
  });
  await supabase.from("audit_logs").insert({
    company_id: tenant.company.id,
    actor_id: tenant.user.id,
    action: `approval.${decision}`,
    table_name: "approvals",
    record_id: approvalId,
    after: { staff_id: staffId, reason },
    created_by: tenant.user.id,
  });
  await supabase.from("notifications").insert({
    company_id: tenant.company.id,
    user_id: tenant.user.id,
    title: `Staff account ${decision}`,
    body: reason || "Approval decision recorded.",
    created_by: tenant.user.id,
  });
  revalidatePath("/approvals");
  revalidatePath("/staff");
  revalidatePath(`/staff/${staffId}`);
}
