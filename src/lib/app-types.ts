import type { LucideIcon } from "lucide-react";

export type TenantContext = {
  company: { id: string; name: string; logoUrl?: string | null; themeColor: string; currency: string; timezone: string; address: string; email?: string | null; phone?: string | null; website?: string | null; country?: string | null; city?: string | null; taxRegistrationNumber?: string | null; slogan?: string | null };
  user: { id: string; name: string; email: string; role: string; avatarUrl?: string | null; permissions?: string[]; modules?: string[] };
};

export type ModuleField = { label: string; key: string; type?: "text" | "number" | "date" | "select" | "textarea"; options?: string[] };
export type ModuleConfig = { title: string; description: string; table: string; primaryAction?: string; filters: string[]; fields: ModuleField[]; rows: Record<string, string | number>[]; icon?: LucideIcon };
