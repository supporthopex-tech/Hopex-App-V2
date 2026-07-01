"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm({ invalidLink = false }: { invalidLink?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(invalidLink ? "This reset link is invalid or expired. Request a new one below." : "");

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      const email = String(formData.get("email") ?? "").trim().toLowerCase();
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(result.error ?? "Could not send the reset email. Please try again."));
      setSent(true);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Could not send the reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {sent ? (
        <p className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          Reset email sent. Check your inbox and spam folder.
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <form action={onSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <Button disabled={loading}>{loading ? "Sending..." : "Send reset email"}</Button>
      </form>
    </>
  );
}
