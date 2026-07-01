"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, isSupabaseConfigured } from "@/lib/tenant";

type ActionState = { ok: boolean; message: string };
type MutationClient = {
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } } | Promise<{ error: { message: string } | null }>;
    update: (payload: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
    delete: () => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
  };
};

export async function createCustomer(prevState: ActionState = { ok: true, message: "" }, formData: FormData): Promise<ActionState> {
  void prevState;
  const tenant = await requirePermission("customers.create");
  if (!isSupabaseConfigured()) {
    revalidatePath("/customers");
    redirect("/customers");
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  const result = supabase.from("customers").insert({
    company_id: tenant.company.id,
    full_name: String(formData.get("full_name") ?? ""),
    company_name: String(formData.get("company_name") ?? ""),
    contact_name: String(formData.get("full_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    address: String(formData.get("address") ?? ""),
    city: String(formData.get("city") ?? ""),
    country: String(formData.get("country") ?? ""),
    customer_type: String(formData.get("customer_type") || "standard"),
    status: String(formData.get("status") || "active"),
    is_vip: formData.get("is_vip") === "on",
    notes: String(formData.get("notes") ?? ""),
    created_by: tenant.user.id,
  }) as { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
  const { data, error } = await result.select("id").single();
  if (error || !data) return { ok: false, message: error?.message ?? "Could not create customer." };
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, "customer.created", String(data.id), "Customer created");
  revalidatePath("/customers");
  redirect(`/customers/${data.id}`);
}

export async function updateCustomerFlag(formData: FormData) {
  const id = String(formData.get("customer_id") ?? "");
  const tenant = await requirePermission("customers.edit");
  if (!isSupabaseConfigured()) {
    revalidatePath("/customers");
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  const payload: Record<string, unknown> = {};
  if (formData.has("status")) payload.status = String(formData.get("status"));
  if (formData.has("is_vip")) payload.is_vip = formData.get("is_vip") === "true";
  await supabase.from("customers").update(payload).eq("id", id);
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, "customer.updated", id, "Customer updated");
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
}

export async function updateCustomer(formData: FormData) {
  const id = String(formData.get("customer_id") ?? "");
  const tenant = await requirePermission("customers.edit");
  if (!isSupabaseConfigured()) {
    revalidatePath(`/customers/${id}`);
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("customers").update({
    full_name: String(formData.get("full_name") ?? ""),
    company_name: String(formData.get("company_name") ?? ""),
    contact_name: String(formData.get("full_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    address: String(formData.get("address") ?? ""),
    city: String(formData.get("city") ?? ""),
    country: String(formData.get("country") ?? ""),
    customer_type: String(formData.get("customer_type") ?? "standard"),
    notes: String(formData.get("notes") ?? ""),
  }).eq("id", id);
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, "customer.updated", id, "Customer updated");
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
}

export async function deleteCustomer(formData: FormData) {
  await requirePermission("customers.delete");
  const id = String(formData.get("customer_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath("/customers");
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("customers").delete().eq("id", id);
  revalidatePath("/customers");
}

async function auditAndNotify(supabase: MutationClient, companyId: string, actorId: string, action: string, recordId: string, title: string) {
  await supabase.from("audit_logs").insert({ company_id: companyId, actor_id: actorId, action, table_name: "customers", record_id: recordId, created_by: actorId });
  await supabase.from("notifications").insert({ company_id: companyId, user_id: actorId, title, body: "Customer activity recorded.", created_by: actorId });
}
