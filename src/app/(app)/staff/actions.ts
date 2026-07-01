"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendCompanyEmail } from "@/lib/email/send";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAnyPermission, requirePermission, isSupabaseConfigured } from "@/lib/tenant";

type ActionState = { ok: boolean; message: string };
const initialOk: ActionState = { ok: true, message: "" };

type MutationClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
      in: (column: string, values: string[]) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
    };
    insert: (payload: Record<string, unknown> | Record<string, unknown>[]) => {
      select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> };
    } | Promise<{ error: { message: string } | null }>;
    update: (payload: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
    delete: () => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
  };
};

const portalPermissionMap: Record<string, string[]> = {
  Dashboard: ["dashboard.read"],
  Shipments: ["shipments.view", "shipments.create", "shipments.edit", "shipments.update_status", "shipments.manage_documents"],
  "Packing Lists": ["packing_lists.view", "packing_lists.create", "packing_lists.update", "packing_lists.export"],
  Quotes: ["quotes.view", "quotes.create", "quotes.edit", "quotes.convert"],
  "Staff Members": ["staff.view"],
  Customers: ["customers.view", "customers.create", "customers.edit"],
  Tasks: ["tasks.view", "tasks.create", "tasks.edit"],
  Accounting: ["accounting.view", "invoices.view", "payments.view", "expenses.view"],
  Reports: ["reports.view"],
  Settings: ["settings.view"],
  Email: ["email.view", "email.send"],
  WhatsApp: ["whatsapp.view", "whatsapp.send"],
  Approvals: ["approvals.view"],
};

export async function createStaff(prevState: ActionState = initialOk, formData: FormData): Promise<ActionState> {
  void prevState;
  const tenant = await requirePermission("staff.create");
  const createLogin = formData.get("create_login_account") === "on";

  if (!isSupabaseConfigured()) {
    revalidatePath("/staff");
    redirect("/staff");
  }

  const supabase = (await createClient()) as unknown as MutationClient;
  let userId: string | null = null;
  let accountStatus = createLogin ? "pending_approval" : "not_invited";

  if (createLogin) {
    try {
      const admin = getSupabaseAdmin();
      const email = String(formData.get("email") ?? "");
      const invite = await admin.auth.admin.inviteUserByEmail(email, {
        data: { company_id: tenant.company.id, full_name: String(formData.get("full_name") ?? "") },
      });
      userId = invite.data.user?.id ?? null;
      accountStatus = userId ? "pending_approval" : "not_invited";
    } catch {
      accountStatus = "not_invited";
    }
  }

  const insertResult = supabase.from("staff").insert({
    company_id: tenant.company.id,
    staff_id: String(formData.get("staff_id") ?? ""),
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    role_id: String(formData.get("role_id") || "") || null,
    department: String(formData.get("department") ?? ""),
    position: String(formData.get("position") ?? ""),
    location: String(formData.get("location") ?? ""),
    join_date: String(formData.get("join_date") || "") || null,
    status: createLogin ? "pending_approval" : String(formData.get("status") ?? "active"),
    account_status: accountStatus,
    user_id: userId,
    notes: String(formData.get("notes") ?? ""),
    created_by: tenant.user.id,
  }) as { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };

  const { data, error } = await insertResult.select("id").single();
  if (error || !data) return { ok: false, message: error?.message ?? "Could not create staff." };
  await saveStaffPermissions(supabase, tenant.company.id, tenant.user.id, String(data.id), formData.getAll("portal_permissions").map(String));

  if (userId) {
    await ensureCompanyUser(supabase, tenant.company.id, tenant.user.id, userId, String(formData.get("role_id") || "") || null);
  }
  await supabase.from("approvals").insert({
    company_id: tenant.company.id,
    approval_type: "staff_account",
    reference_table: "staff",
    reference_id: String(data.id),
    status: "pending",
    comments: [{ message: "Staff account submitted for approval.", at: new Date().toISOString() }],
    created_by: tenant.user.id,
  });
  await supabase.from("approval_history").insert({
    company_id: tenant.company.id,
    staff_id: String(data.id),
    action: "submitted",
    reason: "New staff account created.",
    actor_id: tenant.user.id,
    created_by: tenant.user.id,
  });
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, "staff.created", String(data.id), "Staff member created");
  revalidatePath("/staff");
  redirect(`/staff/${data.id}`);
}

export async function updateStaff(formData: FormData) {
  const tenant = await requirePermission("staff.edit");
  const id = String(formData.get("staff_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath(`/staff/${id}`);
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("staff").update({
    staff_id: String(formData.get("staff_id_value") ?? ""),
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    role_id: String(formData.get("role_id") || "") || null,
    department: String(formData.get("department") ?? ""),
    position: String(formData.get("position") ?? ""),
    location: String(formData.get("location") ?? ""),
    join_date: String(formData.get("join_date") || "") || null,
    status: String(formData.get("status") ?? "active"),
    notes: String(formData.get("notes") ?? ""),
  }).eq("id", id);
  await saveStaffPermissions(supabase, tenant.company.id, tenant.user.id, id, formData.getAll("portal_permissions").map(String));
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, "staff.updated", id, "Staff member updated");
  revalidatePath("/staff");
  revalidatePath(`/staff/${id}`);
}

export async function updateStaffStatus(formData: FormData) {
  const tenant = await requireAnyPermission(["staff.suspend", "staff.activate"]);
  const id = String(formData.get("staff_id") ?? "");
  const status = String(formData.get("status") ?? "active");
  const accountStatus = status === "suspended" ? "suspended" : "active";
  if (!isSupabaseConfigured()) {
    revalidatePath("/staff");
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("staff").update({ status, account_status: accountStatus }).eq("id", id);
  const staff = await supabase.from("staff").select("user_id").eq("id", id).single();
  const userId = staff.data?.user_id ? String(staff.data.user_id) : "";
  if (userId) {
    await supabase.from("company_users").update({ status: status === "suspended" ? "suspended" : "active" }).eq("user_id", userId);
  }
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, `staff.${status}`, id, `Staff ${status}`);
  revalidatePath("/staff");
  revalidatePath(`/staff/${id}`);
}

export async function inviteStaff(formData: FormData) {
  const tenant = await requirePermission("staff.invite");
  const id = String(formData.get("staff_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath(`/staff/${id}`);
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  const staff = await supabase.from("staff").select("email,full_name,role_id,user_id").eq("id", id).single();
  if (!staff.data) return;
  let userId = staff.data.user_id ? String(staff.data.user_id) : "";
  if (!userId) {
    const admin = getSupabaseAdmin();
    const invite = await admin.auth.admin.inviteUserByEmail(String(staff.data.email), {
      data: { company_id: tenant.company.id, full_name: String(staff.data.full_name ?? "") },
    });
    userId = invite.data.user?.id ?? "";
  }
  if (userId) {
    await supabase.from("staff").update({ user_id: userId, account_status: "pending_approval", status: "pending_approval" }).eq("id", id);
    await ensureCompanyUser(supabase, tenant.company.id, tenant.user.id, userId, String(staff.data.role_id || "") || null);
  }
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, "staff.invited", id, "Staff invitation sent");
  revalidatePath("/staff");
  revalidatePath(`/staff/${id}`);
}

export async function resetStaffPassword(formData: FormData) {
  const tenant = await requireAnyPermission(["staff.edit", "staff.invite"]);
  const id = String(formData.get("staff_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath(`/staff/${id}`);
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  const staff = await supabase.from("staff").select("email,full_name").eq("id", id).single();
  const email = String(staff.data?.email ?? "");
  if (email) {
    const admin = getSupabaseAdmin();
    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
    const vercelAppUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "";
    const appUrl = configuredAppUrl || vercelAppUrl;
    const redirectTo = `${appUrl || "http://localhost:3000"}/auth/callback?next=/reset-password`;
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (error) throw new Error(error.message);
    const actionLink = data.properties?.action_link;
    if (!actionLink) throw new Error("Could not generate password reset link.");
    const subject = "Reset your staff account password";
    const body = `Use this secure link to reset your staff account password:\n\n${actionLink}\n\nIf you did not request this, contact your administrator.`;
    try {
      const result = await sendCompanyEmail({
        tenant,
        to: email,
        subject,
        body,
        templateKey: "general",
        context: { customerName: String(staff.data?.full_name ?? "there"), message: body },
        attachments: [],
      });
      await supabase.from("email_logs").insert({
        company_id: tenant.company.id,
        event_type: "staff_password_reset_sent",
        status: "sent",
        recipient: email,
        subject: result.subject,
        sent_by: tenant.user.id,
        resend_message_id: result.resendMessageId,
        sent_at: new Date().toISOString(),
        metadata: { source: "staff_password_reset", recipient: email, resend_message_id: result.resendMessageId },
        created_by: tenant.user.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send staff password reset email.";
      await supabase.from("email_logs").insert({
        company_id: tenant.company.id,
        event_type: "staff_password_reset_failed",
        status: "failed",
        recipient: email,
        subject,
        sent_by: tenant.user.id,
        error_message: message,
        metadata: { source: "staff_password_reset", recipient: email, error_message: message },
        created_by: tenant.user.id,
      });
      throw new Error(message);
    }
    await auditAndNotify(supabase, tenant.company.id, tenant.user.id, "staff.password_reset_sent", id, "Password reset sent");
  }
  revalidatePath(`/staff/${id}`);
}

export async function deleteStaff(formData: FormData) {
  await requirePermission("staff.delete");
  const id = String(formData.get("staff_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath("/staff");
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("staff").delete().eq("id", id);
  revalidatePath("/staff");
}

async function saveStaffPermissions(
  supabase: MutationClient,
  companyId: string,
  actorId: string,
  staffId: string,
  labels: string[],
) {
  const keys = [...new Set(labels.flatMap((label) => portalPermissionMap[label] ?? []))];
  await supabase.from("staff_permissions").delete().eq("staff_id", staffId);
  if (!keys.length) return;
  const permissionResult = await supabase.from("permissions").select("id,key").in("key", keys);
  const rows = (permissionResult.data ?? []).map((permission) => ({
    company_id: companyId,
    staff_id: staffId,
    permission_id: String(permission.id),
    enabled: true,
    created_by: actorId,
  }));
  if (rows.length) await supabase.from("staff_permissions").insert(rows);
}

async function ensureCompanyUser(
  supabase: MutationClient,
  companyId: string,
  actorId: string,
  userId: string,
  roleId: string | null,
) {
  const existing = await supabase.from("company_users").select("id").eq("user_id", userId).single();
  if (existing.data?.id) {
    await supabase.from("company_users").update({ role_id: roleId, status: "invited" }).eq("id", String(existing.data.id));
    return;
  }

  await supabase.from("company_users").insert({
    company_id: companyId,
    user_id: userId,
    role_id: roleId,
    status: "invited",
    created_by: actorId,
  });
}

async function auditAndNotify(
  supabase: MutationClient,
  companyId: string,
  actorId: string,
  action: string,
  recordId: string,
  title: string,
) {
  await supabase.from("audit_logs").insert({
    company_id: companyId,
    actor_id: actorId,
    action,
    table_name: "staff",
    record_id: recordId,
    created_by: actorId,
  });
  await supabase.from("notifications").insert({
    company_id: companyId,
    user_id: actorId,
    title,
    body: "Staff management activity recorded.",
    created_by: actorId,
  });
}
