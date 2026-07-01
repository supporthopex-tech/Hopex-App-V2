"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/tenant";

type MutationClient = {
  from: (table: string) => {
    update: (payload: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
    delete: () => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
  };
};

export async function markNotificationRead(formData: FormData) {
  await requireTenantContext();
  const id = String(formData.get("notification_id") ?? "");
  if (!id) return;
  const supabase = (await createClient()) as unknown as MutationClient;
  const result = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/notifications");
}

export async function markNotificationUnread(formData: FormData) {
  await requireTenantContext();
  const id = String(formData.get("notification_id") ?? "");
  if (!id) return;
  const supabase = (await createClient()) as unknown as MutationClient;
  const result = await supabase.from("notifications").update({ read_at: null }).eq("id", id);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/notifications");
}

export async function deleteNotification(formData: FormData) {
  await requireTenantContext();
  const id = String(formData.get("notification_id") ?? "");
  if (!id) return;
  const supabase = (await createClient()) as unknown as MutationClient;
  const result = await supabase.from("notifications").delete().eq("id", id);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/notifications");
}
