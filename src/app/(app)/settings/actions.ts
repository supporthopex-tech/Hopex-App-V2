"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeCurrency } from "@/lib/currencies";
import { requireAnyPermission, requirePermission, requireTenant, isSupabaseConfigured } from "@/lib/tenant";

type MutationClient = {
  auth?: {
    signOut: () => Promise<{ error: { message: string } | null }>;
    updateUser: (attributes: { password?: string; data?: Record<string, unknown> }) => Promise<{ error: { message: string } | null }>;
  };
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    upsert: (payload: Record<string, unknown>, options?: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    update: (payload: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
  };
  storage?: {
    from: (bucket: string) => {
      upload: (path: string, file: File, options?: { upsert?: boolean; contentType?: string }) => Promise<{ error: { message: string } | null }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
      remove: (paths: string[]) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export async function saveCompanySettings(formData: FormData) {
  const tenant = await requirePermission("settings.manage_company");
  if (!isSupabaseConfigured()) return revalidatePath("/settings");
  const supabase = (await createClient()) as unknown as MutationClient;
  const uploadedLogoUrl = await uploadImage(supabase, "company-assets", `${tenant.company.id}/logo`, formData.get("logo_file"));
  const logoUrl = uploadedLogoUrl || String(formData.get("logo_url") ?? tenant.company.logoUrl ?? "");
  await supabase.from("companies").update({
    name: String(formData.get("company_name") ?? tenant.company.name),
    slogan: String(formData.get("slogan") ?? ""),
    logo_url: logoUrl,
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    tax_registration_number: String(formData.get("tax_registration_number") ?? ""),
    website: String(formData.get("website") ?? ""),
    country: String(formData.get("country") ?? ""),
    city: String(formData.get("city") ?? ""),
    currency: normalizeCurrency(formData.get("currency") ?? tenant.company.currency),
    timezone: String(formData.get("timezone") ?? tenant.company.timezone),
    theme_color: String(formData.get("primary_color") ?? tenant.company.themeColor),
    primary_color: String(formData.get("primary_color") ?? tenant.company.themeColor),
  }).eq("id", tenant.company.id);
  await audit(supabase, tenant.company.id, tenant.user.id, "settings.company_updated");
  revalidateAllSettings();
}

export async function saveInvoiceSettings(formData: FormData) {
  const tenant = await requireAnyPermission(["settings.manage_company", "invoices.edit"]);
  if (!isSupabaseConfigured()) return revalidatePath("/settings/invoicing");
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("invoice_settings").upsert({
    company_id: tenant.company.id,
    invoice_prefix: String(formData.get("invoice_prefix") ?? "INV"),
    next_invoice_number: Number(formData.get("next_invoice_number") || 1),
    quote_prefix: String(formData.get("quote_prefix") ?? "QT"),
    payment_receipt_prefix: String(formData.get("payment_receipt_prefix") ?? "PAY"),
    default_tax_rate: Number(formData.get("default_tax_rate") || 0),
    payment_terms: String(formData.get("payment_terms") ?? ""),
    footer_notes: String(formData.get("footer_notes") ?? ""),
    bank_details: String(formData.get("bank_details") ?? ""),
    created_by: tenant.user.id,
  }, { onConflict: "company_id" });
  await audit(supabase, tenant.company.id, tenant.user.id, "settings.invoicing_updated");
  revalidateAllSettings();
}

export async function saveBrandingSettings(formData: FormData) {
  const tenant = await requirePermission("settings.manage_branding");
  if (!isSupabaseConfigured()) return revalidatePath("/settings/appearance");
  const supabase = (await createClient()) as unknown as MutationClient;
  const primaryColor = String(formData.get("primary_color") ?? tenant.company.themeColor);
  await supabase.from("branding_settings").upsert({
    company_id: tenant.company.id,
    theme_mode: String(formData.get("theme_mode") ?? "dark"),
    primary_color: primaryColor,
    sidebar_style: String(formData.get("sidebar_style") ?? "default"),
    compact_mode: formData.get("compact_mode") === "on",
    created_by: tenant.user.id,
  }, { onConflict: "company_id" });
  await supabase.from("companies").update({ theme_color: primaryColor, primary_color: primaryColor }).eq("id", tenant.company.id);
  await audit(supabase, tenant.company.id, tenant.user.id, "settings.branding_updated");
  revalidateAllSettings();
}

export async function saveNotificationSettings(formData: FormData) {
  const tenant = await requirePermission("settings.manage_company");
  if (!isSupabaseConfigured()) return revalidatePath("/settings/notifications");
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("notification_settings").upsert({
    company_id: tenant.company.id,
    email_notifications: formData.get("email_notifications") === "on",
    whatsapp_notifications: formData.get("whatsapp_notifications") === "on",
    shipment_notifications: formData.get("shipment_notifications") === "on",
    payment_notifications: formData.get("payment_notifications") === "on",
    task_notifications: formData.get("task_notifications") === "on",
    approval_notifications: formData.get("approval_notifications") === "on",
    created_by: tenant.user.id,
  }, { onConflict: "company_id" });
  await audit(supabase, tenant.company.id, tenant.user.id, "settings.notifications_updated");
  revalidateAllSettings();
}

export async function inviteUser(formData: FormData) {
  const tenant = await requirePermission("settings.manage_users");
  if (!isSupabaseConfigured()) return revalidatePath("/settings/invite-users");
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("invitation_tokens").insert({
    company_id: tenant.company.id,
    email: String(formData.get("email") ?? ""),
    role_id: String(formData.get("role_id") || "") || null,
    permissions: String(formData.get("permissions") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
    token: crypto.randomUUID(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: tenant.user.id,
  });
  await audit(supabase, tenant.company.id, tenant.user.id, "settings.user_invited");
  revalidatePath("/settings/invite-users");
}

export async function saveMyAccountSettings(formData: FormData) {
  const tenant = await requireTenant();
  if (!isSupabaseConfigured()) return revalidatePath("/settings/my-account");
  const supabase = (await createClient()) as unknown as MutationClient;
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const profilePhotoUrl = await uploadImage(supabase, "profile-images", `${tenant.company.id}/${tenant.user.id}`, formData.get("profile_photo_file"));
  const explicitPhotoUrl = String(formData.get("profile_photo_url") ?? "");
  const finalPhotoUrl = profilePhotoUrl || explicitPhotoUrl || tenant.user.avatarUrl || "";

  if (password) {
    if (password !== confirmPassword) throw new Error("Password confirmation does not match.");
    const passwordError = validatePassword(password);
    if (passwordError) throw new Error(passwordError);
    const result = await supabase.auth?.updateUser({ password, data: { password_updated_at: new Date().toISOString() } });
    if (result?.error) throw new Error(result.error.message);
    await supabase.from("password_audit_logs").insert({
      company_id: tenant.company.id,
      user_id: tenant.user.id,
      action: "password.changed",
      created_by: tenant.user.id,
    });
  }

  await supabase.from("user_settings").upsert({
    company_id: tenant.company.id,
    user_id: tenant.user.id,
    first_name: String(formData.get("first_name") ?? ""),
    last_name: String(formData.get("last_name") ?? ""),
    email: String(formData.get("email") ?? tenant.user.email),
    phone: String(formData.get("phone") ?? ""),
    profile_photo_url: finalPhotoUrl,
    created_by: tenant.user.id,
  }, { onConflict: "company_id,user_id" });
  await supabase.from("profiles").update({
    full_name: [String(formData.get("first_name") ?? ""), String(formData.get("last_name") ?? "")].filter(Boolean).join(" "),
    email: String(formData.get("email") ?? tenant.user.email),
    phone: String(formData.get("phone") ?? ""),
    avatar_url: finalPhotoUrl,
  }).eq("id", tenant.user.id);
  await supabase.from("staff").update({ profile_photo_url: finalPhotoUrl }).eq("user_id", tenant.user.id);
  await audit(supabase, tenant.company.id, tenant.user.id, "settings.my_account_updated");
  revalidatePath("/settings/my-account");
}

export async function logoutCurrentUser() {
  await requireTenant();
  if (isSupabaseConfigured()) {
    const supabase = (await createClient()) as unknown as MutationClient;
    const result = await supabase.auth?.signOut();
    if (result?.error) throw new Error(result.error.message);
  }
  redirect("/login");
}

export async function saveLanguageSettings(formData: FormData) {
  const tenant = await requireTenant();
  if (!isSupabaseConfigured()) return revalidatePath("/settings/language");
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("company_settings").upsert({
    company_id: tenant.company.id,
    language_preferences: {
      language: String(formData.get("default_language") ?? "English"),
      date_format: String(formData.get("date_format") ?? "dd/MM/yyyy"),
      number_format: String(formData.get("number_format") ?? "1,234.56"),
      currency_format: String(formData.get("currency_format") ?? "symbol"),
    },
    created_by: tenant.user.id,
  }, { onConflict: "company_id" });
  await audit(supabase, tenant.company.id, tenant.user.id, "settings.language_updated");
  revalidateAllSettings();
}

async function audit(supabase: MutationClient, companyId: string, actorId: string, action: string) {
  await supabase.from("audit_logs").insert({ company_id: companyId, actor_id: actorId, action, table_name: "settings", created_by: actorId });
  await supabase.from("notifications").insert({ company_id: companyId, user_id: actorId, title: action.replaceAll(".", " "), body: "Settings updated.", created_by: actorId });
}

function revalidateAllSettings() {
  ["/settings", "/settings/company", "/settings/invoicing", "/settings/my-account", "/settings/appearance", "/settings/notifications", "/settings/invite-users", "/settings/language"].forEach((path) => revalidatePath(path));
}

async function uploadImage(supabase: MutationClient, bucket: string, prefix: string, value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return "";
  if (!value.type.startsWith("image/")) throw new Error("Only image files are allowed for logo and profile photos.");
  if (value.size > 2 * 1024 * 1024) throw new Error("Image must be 2MB or smaller.");
  const extension = value.name.split(".").pop() || "png";
  const path = `${prefix}-${Date.now()}.${extension}`;
  const upload = await supabase.storage?.from(bucket).upload(path, value, { upsert: true, contentType: value.type });
  if (upload?.error) throw new Error(upload.error.message);
  return supabase.storage?.from(bucket).getPublicUrl(path).data.publicUrl ?? "";
}

function validatePassword(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include a special character.";
  return "";
}
