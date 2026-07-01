import "server-only";

import { NextResponse } from "next/server";

const corsMethods = "GET, POST, OPTIONS";
const corsHeaders = "Content-Type";

export function getDeploymentCompanyId() {
  const companyId = process.env.APP_COMPANY_ID?.trim();
  if (!companyId) {
    throw new Error("APP_COMPANY_ID is required for a single-company deployment.");
  }
  return companyId;
}

export function isWebsiteOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return getAllowedOrigins().has(normalizeOrigin(origin));
}

export function withWebsiteCors<T extends NextResponse>(request: Request, response: T): T {
  const origin = request.headers.get("origin");
  response.headers.set("Vary", "Origin");
  response.headers.set("Access-Control-Allow-Methods", corsMethods);
  response.headers.set("Access-Control-Allow-Headers", corsHeaders);
  if (origin && getAllowedOrigins().has(normalizeOrigin(origin))) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  return response;
}

export function websiteCorsPreflight(request: Request) {
  if (!isWebsiteOriginAllowed(request)) {
    return withWebsiteCors(
      request,
      NextResponse.json({ error: "Origin not allowed" }, { status: 403 }),
    );
  }
  return withWebsiteCors(request, new NextResponse(null, { status: 204 }));
}

function getAllowedOrigins() {
  const configured = process.env.COMPANY_WEBSITE_ORIGINS ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return new Set(
    [configured, appUrl]
      .flatMap((value) => value.split(","))
      .map(normalizeOrigin)
      .filter(Boolean),
  );
}

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/$/, "");
}
