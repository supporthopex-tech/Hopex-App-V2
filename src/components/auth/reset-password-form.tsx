"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { isSupabasePublicConfigAvailable } from "@/lib/supabase/env";
import { validatePasswordStrength } from "@/lib/auth/validation";

export function ResetPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const password = String(formData.get("password") ?? "");
      const confirmPassword = String(formData.get("confirm_password") ?? "");
      const passwordError = validatePasswordStrength(password);
      if (passwordError) throw new Error(passwordError);
      if (password !== confirmPassword) throw new Error("Passwords do not match.");
      if (!isSupabasePublicConfigAvailable()) throw new Error("Authentication is not configured.");
      const supabase = createClient();
      const result = await supabase.auth.updateUser({ password });
      if (result.error) throw result.error;
      toast.success("Password updated. Sign in again.");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      <div className="grid gap-2"><Label htmlFor="password">New password</Label><Input id="password" name="password" type="password" autoComplete="new-password" required /></div>
      <div className="grid gap-2"><Label htmlFor="confirm_password">Confirm password</Label><Input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" required /></div>
      <Button disabled={loading}>{loading ? "Saving..." : "Reset password"}</Button>
    </form>
  );
}
