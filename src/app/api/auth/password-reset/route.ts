import { NextResponse } from "next/server";
import { z } from "zod";
import { getDeploymentCompanyId } from "@/lib/deployment";
import { sendCompanyEmail } from "@/lib/email/send";
import { logError } from "@/lib/observability";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { TenantContext } from "@/lib/app-types";

const passwordResetSchema = z.object({
  email: z.string().trim().email().max(254),
  redirectTo: z.string().trim().url().max(2048),
});

export async function POST(request: Request) {
  const parsed = passwordResetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const admin = getSupabaseAdmin();
  const companyId = getDeploymentCompanyId();
  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id,name,logo_url,theme_color,primary_color,currency,timezone,address,email,phone,website,country,city,tax_registration_number,slogan")
    .eq("id", companyId)
    .single();
  if (companyError || !company) return NextResponse.json({ error: "Password reset is not configured." }, { status: 503 });

  const tenant = tenantFromCompany(company as Record<string, unknown>);
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: parsed.data.email,
    options: { redirectTo: parsed.data.redirectTo },
  });

  if (error) {
    logError("auth.password_reset_link_failed", error, { email: parsed.data.email });
    return NextResponse.json({ ok: true });
  }

  const actionLink = data.properties?.action_link;
  if (!actionLink) {
    logError("auth.password_reset_link_missing", new Error("Supabase did not return a recovery action link."), { email: parsed.data.email });
    return NextResponse.json({ error: "Password reset could not be prepared." }, { status: 503 });
  }

  try {
    const subject = "Reset your account password";
    const body = `Use this secure link to reset your password:\n\n${actionLink}\n\nIf you did not request this, you can ignore this email.`;
    const result = await sendCompanyEmail({
      tenant,
      to: parsed.data.email,
      subject,
      body,
      templateKey: "general",
      context: { customerName: "there", message: body },
      attachments: [],
    });
    await (admin.from("email_logs") as unknown as { insert: (payload: Record<string, unknown>) => Promise<unknown> }).insert({
      company_id: tenant.company.id,
      event_type: "password_reset_sent",
      status: "sent",
      recipient: parsed.data.email,
      subject: result.subject,
      resend_message_id: result.resendMessageId,
      sent_at: new Date().toISOString(),
      metadata: { source: "password_reset", recipient: parsed.data.email, resend_message_id: result.resendMessageId },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send password reset email.";
    logError("auth.password_reset_email_failed", error, { email: parsed.data.email });
    await (admin.from("email_logs") as unknown as { insert: (payload: Record<string, unknown>) => Promise<unknown> }).insert({
      company_id: tenant.company.id,
      event_type: "password_reset_failed",
      status: "failed",
      recipient: parsed.data.email,
      subject: "Reset your account password",
      error_message: message,
      metadata: { source: "password_reset", recipient: parsed.data.email, error_message: message },
    });
    return NextResponse.json({ error: "Password reset email is not configured. Please contact the administrator." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}

function tenantFromCompany(company: Record<string, unknown>): TenantContext {
  const text = (key: string) => String(company[key] ?? "");
  return {
    company: {
      id: text("id"),
      name: text("name"),
      logoUrl: text("logo_url"),
      themeColor: text("primary_color") || text("theme_color") || "#2563eb",
      currency: text("currency") || "USD",
      timezone: text("timezone") || "UTC",
      address: text("address"),
      email: text("email"),
      phone: text("phone"),
      website: text("website"),
      country: text("country"),
      city: text("city"),
      taxRegistrationNumber: text("tax_registration_number"),
      slogan: text("slogan"),
    },
    user: {
      id: "00000000-0000-0000-0000-000000000000",
      name: "Auth system",
      email: text("email") || "support@hopexgroup.co.tz",
      role: "system",
      permissions: [],
      modules: [],
    },
  };
}
