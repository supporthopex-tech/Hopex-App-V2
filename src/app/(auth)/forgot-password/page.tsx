import Link from "next/link";
import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthCardShell>
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Receive a secure password reset email.</CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm invalidLink={Boolean(params.error)} />
          <Button asChild variant="link" className="mt-2 w-full"><Link href="/login">Back to login</Link></Button>
        </CardContent>
      </Card>
    </div>
    </AuthCardShell>
  );
}
