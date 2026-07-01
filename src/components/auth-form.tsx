"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabasePublicConfigAvailable } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const returnTo = useMemo(() => searchParams.get("returnTo") || "/dashboard", [searchParams]);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (!isSupabasePublicConfigAvailable()) {
        throw new Error("Authentication is not configured for this deployment.");
      }

      const supabase = createClient();
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      const access = await checkPortalAccess(supabase);
      if (!access.ok) {
        await supabase.auth.signOut();
        throw new Error(access.message);
      }
      toast.success("Signed in.");
      router.push(returnTo);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="pr-10" />
          <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" name="remember_me" /> Remember me</label>
        <Link href="/forgot-password" className="font-medium text-primary">Forgot password?</Link>
      </div>
      <Button disabled={loading}>{loading ? "Please wait..." : "Sign in"}</Button>
      <p className="text-center text-sm text-muted-foreground">Accounts are created by your company administrator.</p>
    </form>
  );
}

function Field({ label, name, type = "text", autoComplete, required }: { label: string; name: string; type?: string; autoComplete?: string; required?: boolean }) {
  return <div className="grid gap-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} autoComplete={autoComplete} required={required} /></div>;
}

async function checkPortalAccess(supabase: ReturnType<typeof createClient>) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, message: "Could not verify session." };

  const membership = await supabase.from("company_users").select("company_id,status").eq("user_id", user.id).maybeSingle();
  if (membership.error || !membership.data) return { ok: false, message: "No active company workspace found for this account." };
  if (membership.data.status === "suspended" || membership.data.status === "removed") return { ok: false, message: "Your account is suspended." };

  const staff = await supabase.from("staff").select("status,account_status").eq("company_id", membership.data.company_id).eq("user_id", user.id).maybeSingle();
  if (staff.data && (staff.data.status === "pending_approval" || staff.data.account_status === "pending_approval")) return { ok: false, message: "Your staff account is pending approval." };
  if (staff.data && (staff.data.status === "rejected" || staff.data.account_status === "rejected")) return { ok: false, message: "Your staff account was not approved." };
  if (staff.data && (staff.data.status === "suspended" || staff.data.account_status === "suspended")) return { ok: false, message: "Your staff account is suspended." };

  return { ok: true, message: "" };
}
