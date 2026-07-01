"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { visibleNavigation, visibleQuickActions } from "@/lib/authorization";
import { cn, initials } from "@/lib/utils";
import type { TenantContext } from "@/lib/app-types";

export function MobileNav({ tenant }: { tenant: TenantContext }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = visibleNavigation(tenant);
  const actions = visibleQuickActions(tenant);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-10 flex h-dvh w-[86vw] max-w-sm flex-col border-r bg-card shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white"
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
              <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form action="/search" className="border-b p-3" onSubmit={() => setOpen(false)}>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" name="q" placeholder="Search..." />
              </div>
            </form>

            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition-colors",
                      active && "bg-primary text-primary-foreground",
                      !active && "hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="grid shrink-0 gap-2 border-t p-3">
              {actions.map((action) => (
                <Button key={action.href} asChild variant="outline" className="justify-start">
                  <Link href={action.href} onClick={() => setOpen(false)}>
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
