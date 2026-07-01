"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAnyPermission, requirePermission, isSupabaseConfigured } from "@/lib/tenant";

type ActionState = { ok: boolean; message: string };
type MutationClient = {
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } } | Promise<{ error: { message: string } | null }>;
    update: (payload: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
    delete: () => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
  };
};

export async function createTask(prevState: ActionState = { ok: true, message: "" }, formData: FormData): Promise<ActionState> {
  void prevState;
  const tenant = await requirePermission("tasks.create");
  if (!isSupabaseConfigured()) {
    revalidatePath("/tasks");
    redirect("/tasks");
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  const result = supabase.from("tasks").insert({
    company_id: tenant.company.id,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    assignee_id: String(formData.get("assignee_id") || "") || null,
    priority: String(formData.get("priority") || "medium"),
    status: String(formData.get("status") || "pending"),
    due_date: String(formData.get("due_date") || "") || null,
    notes: String(formData.get("notes") ?? ""),
    created_by: tenant.user.id,
  }) as { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
  const { data, error } = await result.select("id").single();
  if (error || !data) return { ok: false, message: error?.message ?? "Could not create task." };
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, "task.created", String(data.id), "Task created");
  revalidatePath("/tasks");
  redirect(`/tasks/${data.id}`);
}

export async function updateTaskStatus(formData: FormData) {
  const id = String(formData.get("task_id") ?? "");
  const status = String(formData.get("status") ?? "pending");
  const tenant = await requireAnyPermission(["tasks.edit", "tasks.create"]);
  if (!isSupabaseConfigured()) {
    revalidatePath("/tasks");
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("tasks").update({ status, completed_at: status === "completed" ? new Date().toISOString() : null }).eq("id", id);
  await supabase.from("task_status_logs").insert({ company_id: tenant.company.id, task_id: id, to_status: status, created_by: tenant.user.id });
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, `task.${status}`, id, `Task marked ${status}`);
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
}

export async function updateTask(formData: FormData) {
  const id = String(formData.get("task_id") ?? "");
  const tenant = await requireAnyPermission(["tasks.edit", "tasks.create"]);
  if (!isSupabaseConfigured()) {
    revalidatePath(`/tasks/${id}`);
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("tasks").update({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    assignee_id: String(formData.get("assignee_id") || "") || null,
    priority: String(formData.get("priority") ?? "medium"),
    due_date: String(formData.get("due_date") || "") || null,
    notes: String(formData.get("notes") ?? ""),
  }).eq("id", id);
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, "task.updated", id, "Task updated");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
}

export async function deleteTask(formData: FormData) {
  await requirePermission("tasks.delete");
  const id = String(formData.get("task_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath("/tasks");
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/tasks");
}

async function auditAndNotify(supabase: MutationClient, companyId: string, actorId: string, action: string, recordId: string, title: string) {
  await supabase.from("audit_logs").insert({ company_id: companyId, actor_id: actorId, action, table_name: "tasks", record_id: recordId, created_by: actorId });
  await supabase.from("notifications").insert({ company_id: companyId, user_id: actorId, title, body: "Task activity recorded.", created_by: actorId });
}
