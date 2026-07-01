import "server-only";

import type { TenantContext } from "@/lib/app-types";

export type EmailBranding = {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  website?: string | null;
  phone?: string | null;
  address?: string | null;
};

const DEFAULT_PRIMARY_COLOR = "#0f766e";

export function getEmailBranding(tenant: TenantContext): EmailBranding {
  const companyName = env("COMPANY_NAME") || tenant.company.name;
  const fromEmail = env("RESEND_FROM_EMAIL") || tenant.company.email || tenant.user.email;
  const fromName = env("RESEND_FROM_NAME") || companyName;

  return {
    companyName,
    logoUrl: env("COMPANY_LOGO_URL") || tenant.company.logoUrl || "",
    primaryColor: env("COMPANY_PRIMARY_COLOR") || tenant.company.themeColor || DEFAULT_PRIMARY_COLOR,
    fromEmail,
    fromName,
    replyTo: tenant.company.email || tenant.user.email || undefined,
    website: tenant.company.website,
    phone: tenant.company.phone,
    address: tenant.company.address,
  };
}

export function formatSender(branding: EmailBranding) {
  return `${sanitizeSenderName(branding.fromName)} <${branding.fromEmail}>`;
}

function env(key: string) {
  return process.env[key]?.trim() ?? "";
}

function sanitizeSenderName(value: string) {
  return value.replace(/[<>"]/g, "").trim() || "Hopex Express Cargo";
}
