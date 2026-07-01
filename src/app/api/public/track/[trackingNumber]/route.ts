import { NextResponse } from "next/server";
import { logError } from "@/lib/observability";
import { isWebsiteOriginAllowed, websiteCorsPreflight, withWebsiteCors } from "@/lib/deployment";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPublicShipmentByTrackingNumber } from "@/lib/shipments/service";

type LooseSupabase = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    update: (payload: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
  };
};

export function OPTIONS(request: Request) {
  return websiteCorsPreflight(request);
}

export async function GET(request: Request, { params }: { params: Promise<{ trackingNumber: string }> }) {
  if (!isWebsiteOriginAllowed(request)) return json(request, { error: "Origin not allowed" }, { status: 403 });
  const { trackingNumber } = await params;
  const visitorIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const admin = getSupabaseAdmin() as unknown as LooseSupabase;
  const rateLimit = await admin.rpc("consume_api_rate_limit", { target_key: `tracking:${visitorIp}`, window_seconds: 60, maximum_requests: 60 });
  if (rateLimit.error) {
    logError("public_tracking.rate_limit_failed", rateLimit.error);
    return json(request, { error: "Service temporarily unavailable" }, { status: 503 });
  }
  if (!rateLimit.data) return json(request, { error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  let shipment;
  try {
    shipment = await getPublicShipmentByTrackingNumber(trackingNumber);
  } catch (error) {
    logError("public_tracking.deployment_company_missing", error);
    return json(request, { error: "Service is not configured" }, { status: 503 });
  }
  if (!shipment) return json(request, { error: "Shipment not found" }, { status: 404 });
  try {
    await admin.from("website_tracking_events").insert({
      company_id: shipment.companyId,
      shipment_id: shipment.id,
      tracking_number: shipment.trackingNumber,
      visitor_ip: visitorIp,
      user_agent: request.headers.get("user-agent") ?? "",
    });
    await admin.from("shipments").update({ tracking_access_count: (shipment as unknown as { trackingAccessCount?: number }).trackingAccessCount ?? 1, last_tracked_at: new Date().toISOString() }).eq("id", shipment.id);
  } catch (error) {
    logError("public_tracking.analytics_failed", error, { shipmentId: shipment.id });
  }
  return json(request, {
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    origin: shipment.origin,
    destination: shipment.destination,
    route: shipment.route,
    estimatedDelivery: shipment.estimatedDelivery,
    actualDelivery: shipment.actualDelivery,
    timeline: shipment.timeline,
    deliveryConfirmation: shipment.actualDelivery ? { deliveredAt: shipment.actualDelivery, receiverName: shipment.receiverName } : null,
  });
}

function json(request: Request, body: unknown, init?: ResponseInit) {
  return withWebsiteCors(request, NextResponse.json(body, init));
}
