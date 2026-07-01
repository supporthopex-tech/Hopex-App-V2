import { AuthForm } from "@/components/auth-form";
import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedTenantContext } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function LoginPage() {
  const tenant = await getAuthenticatedTenantContext();
  if (tenant) redirect("/dashboard");

  return (
    <AuthCardShell>
      <div className="mx-auto grid max-w-md gap-6 py-8">
        <CardHeader className="px-0">
          <CardTitle className="text-3xl">Welcome to Hopex Express Cargo</CardTitle>
          <CardDescription>Sign in to manage Hopex deliveries, shipments, invoices, and staff operations.</CardDescription>
        </CardHeader>
        <Suspense fallback={null}><AuthForm /></Suspense>
      </div>
    </AuthCardShell>
  );
}
