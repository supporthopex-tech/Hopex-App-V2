import { NextResponse, type NextRequest } from "next/server";
import { isSupabasePublicConfigAvailable } from "@/lib/supabase/env";

const protectedRoutes = [
  "/dashboard",
  "/shipments",
  "/quotes",
  "/customers",
  "/staff",
  "/tasks",
  "/accounting",
  "/invoices",
  "/payments",
  "/expenses",
  "/approvals",
  "/email",
  "/documents",
  "/notifications",
  "/search",
  "/whatsapp",
  "/reports",
  "/settings",
  "/api/customers",
  "/api/quotes",
  "/api/reports",
  "/api/shipments",
  "/api/staff",
];

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  if (!isSupabasePublicConfigAvailable()) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );
  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("auth-token"));

  if (isProtected && !hasAuthCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
