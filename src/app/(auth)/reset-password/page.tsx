import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  return (
    <AuthCardShell>
      <div className="mx-auto grid max-w-md gap-6 py-8">
        <CardHeader className="px-0">
          <CardTitle className="text-3xl">Create new password</CardTitle>
          <CardDescription>Use a secure password with uppercase, lowercase, number, and special character.</CardDescription>
        </CardHeader>
        <ResetPasswordForm />
      </div>
    </AuthCardShell>
  );
}
