import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { Search } from "lucide-react";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canAccessPath, visibleQuickActions } from "@/lib/authorization";
import { requireTenantContext } from "@/lib/tenant";
import { initials } from "@/lib/utils";
import { headers } from "next/headers";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const tenant = await requireTenantContext();
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname && !canAccessPath(tenant, pathname)) {
    redirect("/dashboard");
  }

  const actions = visibleQuickActions(tenant);
  const brandStyle = {
    "--primary": tenant.company.themeColor,
    "--ring": tenant.company.themeColor,
    "--chart-1": tenant.company.themeColor,
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-background" style={brandStyle}>
      <DesktopSidebar tenant={tenant} />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur lg:px-6">
          <MobileNav tenant={tenant} />
          <div className="hidden min-w-0 items-center gap-3 lg:flex">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white"
              style={{ backgroundColor: tenant.company.themeColor }}
            >
              {tenant.company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.company.logoUrl} alt="" className="h-full w-full rounded-md object-contain p-1" />
              ) : (
                initials(tenant.company.name)
              )}
            </div>
          </div>
          <form action="/search" className="relative hidden flex-1 md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="max-w-md pl-9" name="q" placeholder="Search shipments, quotes, customers..." />
          </form>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {actions.map((action) => (
              <Button key={action.href} asChild variant="outline" size="sm" className="hidden xl:inline-flex">
                <Link href={action.href}>
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Link>
              </Button>
            ))}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {tenant.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                tenant.user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()
              )}
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
