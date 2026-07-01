import Link from "next/link";
import { visibleNavigation } from "@/lib/authorization";
import { initials } from "@/lib/utils";
import type { TenantContext } from "@/lib/app-types";

export function DesktopSidebar({ tenant }: { tenant: TenantContext }) {
  const items = visibleNavigation(tenant);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-card lg:block">
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-semibold text-white"
          style={{ backgroundColor: tenant.company.themeColor }}
        >
          {tenant.company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.company.logoUrl} alt="" className="h-full w-full rounded-md object-contain p-1" />
          ) : initials(tenant.company.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{tenant.company.name}</p>
          <p className="text-xs text-muted-foreground">Dedicated company portal</p>
        </div>
      </div>
      <nav className="space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
