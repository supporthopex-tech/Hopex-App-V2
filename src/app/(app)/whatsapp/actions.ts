"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, isSupabaseConfigured } from "@/lib/tenant";

type MutationClient = {
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    update: (payload: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
    delete: () => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
  };
};

export async function logWhatsAppMessage(formData: FormData) {
  const tenant = await requirePermission("whatsapp.send");
  if (!isSupabaseConfigured()) {
    revalidatePath("/whatsapp/log");
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("whatsapp_messages").insert({
    company_id: tenant.company.id,
    customer_id: String(formData.get("customer_id") || "") || null,
    shipment_id: String(formData.get("shipment_id") || "") || null,
    phone: String(formData.get("phone") ?? ""),
    message_type: String(formData.get("message_type") ?? "Custom Message"),
    template_name: String(formData.get("message_type") ?? "Custom Message"),
    message_body: String(formData.get("message_body") ?? ""),
    message: String(formData.get("message_body") ?? ""),
    status: "link_opened",
    sent_by: tenant.user.id,
    sent_at: new Date().toISOString(),
    created_by: tenant.user.id,
  });
  await supabase.from("whatsapp_logs").insert({ company_id: tenant.company.id, event_type: "wa_link_opened", status: "ready", metadata: { phone: String(formData.get("phone") ?? "") }, created_by: tenant.user.id });
  await supabase.from("notifications").insert({ company_id: tenant.company.id, user_id: tenant.user.id, title: "WhatsApp message ready", body: "Link-based WhatsApp message was prepared.", created_by: tenant.user.id });
  revalidatePath("/whatsapp");
  revalidatePath("/whatsapp/log");
}

export async function saveWhatsAppTemplate(formData: FormData) {
  const tenant = await requirePermission("whatsapp.manage_templates");
  if (!isSupabaseConfigured()) {
    revalidatePath("/whatsapp/templates");
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("whatsapp_templates").insert({
    company_id: tenant.company.id,
    template_name: String(formData.get("template_name") ?? ""),
    message_type: String(formData.get("message_type") ?? "Custom Message"),
    body: String(formData.get("body") ?? ""),
    variables: ["customer_name", "tracking_number", "shipment_status", "destination", "eta", "company_name", "tracking_link", "amount_due"],
    created_by: tenant.user.id,
  });
  revalidatePath("/whatsapp/templates");
}
