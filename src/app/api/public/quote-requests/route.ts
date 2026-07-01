import { NextResponse } from "next/server";
import { z } from "zod";
import { getDeploymentCompanyId, isWebsiteOriginAllowed, websiteCorsPreflight, withWebsiteCors } from "@/lib/deployment";
import { sendCompanyEmail } from "@/lib/email/send";
import { logError, logInfo } from "@/lib/observability";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { TenantContext } from "@/lib/app-types";

type LooseSupabase = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> };
    };
    insert: (payload: Record<string, unknown>) => unknown;
  };
};

const quoteRequestSchema = z.object({
  customerName: z.string().trim().min(1).max(150).optional(),
  customer_name: z.string().trim().min(1).max(150).optional(),
  customerPhone: z.string().trim().max(50).optional(),
  customer_phone: z.string().trim().max(50).optional(),
  customerEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
  customer_email: z.string().trim().email().max(254).optional().or(z.literal("")),
  origin: z.string().trim().max(150).optional(),
  destination: z.string().trim().max(150).optional(),
  cargoDescription: z.string().trim().max(2000).optional(),
  cargo_description: z.string().trim().max(2000).optional(),
  cargoType: z.string().trim().max(100).optional(),
  cargo_type: z.string().trim().max(100).optional(),
  estimatedWeight: z.coerce.number().min(0).max(1_000_000).optional(),
  estimated_weight: z.coerce.number().min(0).max(1_000_000).optional(),
  estimatedPieces: z.coerce.number().int().min(0).max(1_000_000).optional(),
  estimated_pieces: z.coerce.number().int().min(0).max(1_000_000).optional(),
  estimatedVolume: z.coerce.number().min(0).max(1_000_000).optional(),
  estimated_volume: z.coerce.number().min(0).max(1_000_000).optional(),
});

export function OPTIONS(request: Request) {
  return websiteCorsPreflight(request);
}

export async function POST(request: Request) {
  if (!isWebsiteOriginAllowed(request)) return json(request, { error: "Origin not allowed" }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 64_000) return json(request, { error: "Request body too large" }, { status: 413 });
  const parsed = quoteRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(request, { error: "Invalid quote request", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  const body = parsed.data as Record<string, unknown>;
  const customerName = String(body.customerName ?? body.customer_name ?? "");
  if (!customerName) return json(request, { error: "customerName is required" }, { status: 400 });

  let companyId: string;
  try {
    companyId = getDeploymentCompanyId();
  } catch (error) {
    logError("public_quote.deployment_company_missing", error);
    return json(request, { error: "Service is not configured" }, { status: 503 });
  }

  const supabase = getSupabaseAdmin() as unknown as LooseSupabase;
  const visitorIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimit = await supabase.rpc("consume_api_rate_limit", { target_key: `quote:${companyId}:${visitorIp}`, window_seconds: 60, maximum_requests: 10 });
  if (rateLimit.error) {
    logError("public_quote.rate_limit_failed", rateLimit.error, { companyId });
    return json(request, { error: "Service temporarily unavailable" }, { status: 503 });
  }
  if (!rateLimit.data) return json(request, { error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  const fingerprint = await hashRequest(`${companyId}:${visitorIp}:${JSON.stringify(body)}`);
  const reservation = await supabase.rpc("reserve_api_idempotency_key", { target_key: `quote:${fingerprint}`, ttl_seconds: 300 });
  if (reservation.error) {
    logError("public_quote.idempotency_failed", reservation.error, { companyId });
    return json(request, { error: "Service temporarily unavailable" }, { status: 503 });
  }
  if (!reservation.data) return json(request, { error: "Duplicate request" }, { status: 409 });
  const { data: company, error: companyError } = await supabase.from("companies").select("id,name,logo_url,theme_color,primary_color,currency,timezone,address,email,phone,website,country,city,tax_registration_number,slogan").eq("id", companyId).single();
  if (companyError || !company) return json(request, { error: "Deployment company not found" }, { status: 503 });

  const insertBuilder = supabase.from("quote_requests").insert({
    company_id: company.id,
    customer_name: customerName,
    customer_phone: String(body.customerPhone ?? body.customer_phone ?? ""),
    customer_email: String(body.customerEmail ?? body.customer_email ?? ""),
    origin: String(body.origin ?? ""),
    destination: String(body.destination ?? ""),
    cargo_description: String(body.cargoDescription ?? body.cargo_description ?? ""),
    cargo_type: String(body.cargoType ?? body.cargo_type ?? ""),
    estimated_weight: Number(body.estimatedWeight ?? body.estimated_weight ?? 0),
    estimated_pieces: Number(body.estimatedPieces ?? body.estimated_pieces ?? 0),
    estimated_volume: Number(body.estimatedVolume ?? body.estimated_volume ?? 0),
    requested_date: new Date().toISOString().slice(0, 10),
    currency: company.currency,
    status: "new",
    notes: "Public website quote request",
  }) as { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
  const { data, error } = await insertBuilder.select("id,status").single();
  if (error) return json(request, { error: error.message }, { status: 400 });
  await (supabase.from("notifications").insert({
    company_id: company.id,
    title: "New website quote request",
    body: `${customerName} requested a quote.`,
  }) as Promise<{ error: { message: string } | null }>);
  await sendQuoteConfirmationEmail(supabase, company, {
    quoteId: String(data?.id ?? ""),
    customerName,
    customerEmail: String(body.customerEmail ?? body.customer_email ?? ""),
    origin: String(body.origin ?? ""),
    destination: String(body.destination ?? ""),
    cargoDescription: String(body.cargoDescription ?? body.cargo_description ?? ""),
  });
  logInfo("public_quote.created", { companyId: company.id, quoteRequestId: data?.id });
  return json(request, { id: data?.id, status: data?.status }, { status: 201 });
}

function json(request: Request, body: unknown, init?: ResponseInit) {
  return withWebsiteCors(request, NextResponse.json(body, init));
}

async function hashRequest(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sendQuoteConfirmationEmail(
  supabase: LooseSupabase,
  company: Record<string, unknown>,
  quote: { quoteId: string; customerName: string; customerEmail: string; origin: string; destination: string; cargoDescription: string },
) {
  if (!quote.customerEmail) return;
  const tenant = tenantFromCompany(company);
  const subject = "We received your shipping quote request";
  const body = "Thank you for sending your cargo details. Our team will review your request and contact you with pricing and next steps.";
  try {
    const result = await sendCompanyEmail({
      tenant,
      to: quote.customerEmail,
      subject,
      body,
      templateKey: "quote",
      context: {
        customerName: quote.customerName,
        message: body,
        quote: {
          id: quote.quoteId,
          origin: quote.origin,
          destination: quote.destination,
          cargoDescription: quote.cargoDescription,
        },
      },
      attachments: [],
    });
    await logPublicEmail(supabase, tenant, {
      eventType: "public_quote_confirmation_sent",
      status: "sent",
      recipient: quote.customerEmail,
      subject: result.subject,
      resendMessageId: result.resendMessageId,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send quote confirmation email.";
    logError("public_quote.confirmation_email_failed", error, { companyId: tenant.company.id, quoteRequestId: quote.quoteId });
    await logPublicEmail(supabase, tenant, {
      eventType: "public_quote_confirmation_failed",
      status: "failed",
      recipient: quote.customerEmail,
      subject,
      errorMessage: message,
    });
  }
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
      name: "Website",
      email: text("email") || "website@hopexgroup.co.tz",
      role: "system",
      permissions: [],
      modules: [],
    },
  };
}

async function logPublicEmail(
  supabase: LooseSupabase,
  tenant: TenantContext,
  input: {
    eventType: string;
    status: "sent" | "failed" | "pending";
    recipient: string;
    subject: string;
    resendMessageId?: string | null;
    errorMessage?: string | null;
    sentAt?: string | null;
  },
) {
  await (supabase.from("email_logs").insert({
    company_id: tenant.company.id,
    event_type: input.eventType,
    status: input.status,
    recipient: input.recipient,
    subject: input.subject,
    resend_message_id: input.resendMessageId ?? null,
    error_message: input.errorMessage ?? null,
    sent_at: input.sentAt ?? null,
    metadata: {
      source: "public_quote_request",
      recipient: input.recipient,
      subject: input.subject,
      resend_message_id: input.resendMessageId ?? null,
      error_message: input.errorMessage ?? null,
    },
  }) as Promise<{ error: { message: string } | null }>);
}
