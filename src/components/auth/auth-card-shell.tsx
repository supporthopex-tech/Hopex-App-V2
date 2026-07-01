import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

export function AuthCardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-lg border bg-card shadow-2xl lg:grid-cols-[1fr_1.1fr]">
      <AuthBrandPanel />
      <div className="p-5 sm:p-8 lg:p-10">{children}</div>
    </div>
  );
}
