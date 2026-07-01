import { NextResponse } from "next/server";
import { z } from "zod";
import { logError, logInfo } from "@/lib/observability";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type LooseSupabase = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> };
    };
    insert: (payload: Record<string, unknown>) => { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
  };
};

const customerMessageSchema = z.object({
  companySlug: z.string().trim().min(1, "Company slug is required.").max(100).optional(),
  company_slug: z.string().trim().min(1, "Company slug is required.").max(100).optional(),
  companyId: z.string().trim().uuid().optional(),
  company_id: z.string().trim().uuid().optional(),
  name: z.string().trim().min(2, "Customer name must be at least 2 characters.").max(150),
  email: z.string().trim().email("Barua pepe si sahihi.").max(254),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  subject: z.string().trim().max(180).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Ujumbe hauwezi kuwa tupu.").max(4000, "Message is too long."),
  source: z.string().trim().max(80).optional(),
  websiteUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  website_url: z.string().trim().url().max(500).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32_000) {
    return NextResponse.json({ error: "Message is too large." }, { status: 413 });
  }

  const parsed = customerMessageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({
      error: "Invalid customer message.",
      details: parsed.error.flatten().fieldErrors,
    }, { status: 400 });
  }

  const body = parsed.data;
  const companySlug = String(body.companySlug ?? body.company_slug ?? process.env.NEXT_PUBLIC_COMPANY_SLUG ?? process.env.COMPANY_SLUG ?? "").trim();
  const companyId = String(body.companyId ?? body.company_id ?? process.env.APP_COMPANY_ID ?? "").trim();
  if (!companySlug && !companyId) {
    return NextResponse.json({ error: "companySlug or companyId is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin() as unknown as LooseSupabase;
  const visitorIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = request.headers.get("user-agent") ?? "";

  const rateLimit = await supabase.rpc("consume_api_rate_limit", {
    target_key: `message:${companySlug || companyId}:${visitorIp}`,
    window_seconds: 60,
    maximum_requests: 8,
  });
  if (rateLimit.error) {
    logError("public_customer_message.rate_limit_failed", rateLimit.error, { companySlug, companyId });
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
  if (!rateLimit.data) {
    return NextResponse.json({ error: "Too many requests. Please try again in one minute." }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const fingerprint = await hashRequest(`${companySlug || companyId}:${visitorIp}:${body.email}:${body.message}`);
  const reservation = await supabase.rpc("reserve_api_idempotency_key", {
    target_key: `message:${fingerprint}`,
    ttl_seconds: 300,
  });
  if (reservation.error) {
    logError("public_customer_message.idempotency_failed", reservation.error, { companySlug, companyId });
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
  if (!reservation.data) {
    return NextResponse.json({ error: "Duplicate message already received." }, { status: 409 });
  }

  const companyQuery = supabase.from("companies").select("id,name");
  const { data: company, error: companyError } = companyId
    ? await companyQuery.eq("id", companyId).single()
    : await companyQuery.eq("slug", companySlug).single();
  if (companyError || !company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const { data, error } = await supabase.from("customer_messages").insert({
    company_id: company.id,
    customer_name: body.name,
    customer_email: body.email,
    customer_phone: body.phone ?? "",
    subject: body.subject ?? "",
    message: body.message,
    source: body.source ?? "website",
    visitor_ip: visitorIp,
    user_agent: userAgent,
    metadata: {
      websiteUrl: body.websiteUrl ?? body.website_url ?? "",
      receivedBy: "public_customer_message_api",
    },
  }).select("id,status,created_at").single();

  if (error) {
    logError("public_customer_message.insert_failed", error, { companySlug, companyId: company.id });
    return NextResponse.json({ error: "Could not save your message. Please try again." }, { status: 500 });
  }

  await (supabase.from("notifications").insert({
    company_id: company.id,
    title: "New website message",
    body: `${body.name} sent a message from the website.`,
  }) as unknown as Promise<{ error: { message: string } | null }>).catch((notificationError) => {
    logError("public_customer_message.notification_failed", notificationError, { companyId: company.id, messageId: data?.id });
  });

  logInfo("public_customer_message.created", { companyId: company.id, messageId: data?.id });
  return NextResponse.json({
    id: data?.id,
    status: data?.status,
    receivedAt: data?.created_at,
    message: "Message received successfully.",
  }, { status: 201 });
}

async function hashRequest(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
