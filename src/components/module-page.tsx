import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ModuleConfig, TenantContext } from "@/lib/app-types";

function badgeVariant(value: string) {
  const normalized = value.toLowerCase();
  if (["active", "accepted", "approved", "paid", "delivered", "sent", "cleared", "ready", "done"].includes(normalized)) {
    return "success" as const;
  }
  if (["pending", "draft", "customs", "queued", "in progress", "in transit", "partial", "trial"].includes(normalized)) {
    return "warning" as const;
  }
  if (["overdue", "failed", "rejected", "delayed"].includes(normalized)) {
    return "danger" as const;
  }
  return "secondary" as const;
}

export function ModulePage({
  config,
  tenant,
  createHref,
}: {
  config: ModuleConfig;
  tenant: TenantContext;
  createHref?: string;
}) {
  const keys = Object.keys(config.rows[0] ?? {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{config.title}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{config.description}</p>
        </div>
        {config.primaryAction ? (
          <Button asChild>
            <Link href={createHref ?? "#"}>
              <Plus className="h-4 w-4" />
              {config.primaryAction}
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            Company-scoped records for {tenant.company.name}. These map to the `{config.table}` table.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder={`Search ${config.title.toLowerCase()}...`} />
            </div>
            <Select className="md:w-52" defaultValue={config.filters[0]}>
              {config.filters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-3 md:hidden">
            {config.rows.map((row) => (
              <div key={String(row.id)} className="rounded-lg border bg-background p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-semibold text-primary">{String(row.id)}</span>
                  <Button variant="outline" size="sm">Open</Button>
                </div>
                <div className="grid gap-2">
                  {keys.filter((key) => key !== "id").map((key) => {
                    const value = row[key];
                    const isStatus = key.toLowerCase().includes("status") || key.toLowerCase().includes("trend");
                    return (
                      <div key={key} className="flex items-start justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{key.replaceAll("_", " ")}</span>
                        <span className="max-w-[60%] text-right font-medium">
                          {isStatus ? <Badge variant={badgeVariant(String(value))}>{String(value)}</Badge> : String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  {keys.map((key) => (
                    <TableHead key={key}>{key.replaceAll("_", " ")}</TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.rows.map((row) => (
                  <TableRow key={String(row.id)}>
                    {keys.map((key) => {
                      const value = row[key];
                      const isStatus = key.toLowerCase().includes("status") || key.toLowerCase().includes("trend");
                      return (
                        <TableCell key={key} className={key === "id" ? "font-mono text-xs" : undefined}>
                          {isStatus ? <Badge variant={badgeVariant(String(value))}>{String(value)}</Badge> : String(value)}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Open</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
