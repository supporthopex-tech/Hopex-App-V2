import "server-only";

import { z } from "zod";
import { getEmailBranding, formatSender } from "@/lib/email/branding";
import { getResendClient } from "@/lib/email/resend";
import { BrandedEmailTemplate, type EmailTemplateContext, type EmailTemplateKey, renderEmailBody, renderEmailSubject } from "@/lib/email/templates";
import type { TenantContext } from "@/lib/app-types";

export type PreparedAttachment = {
  filename: string;
  content: string;
  contentType: string;
  size: number;
};

export type SendCompanyEmailInput = {
  tenant: TenantContext;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  templateKey: EmailTemplateKey;
  context: EmailTemplateContext;
  attachments: PreparedAttachment[];
};

const emailSchema = z.string().trim().email().max(254);

export async function sendCompanyEmail(input: SendCompanyEmailInput) {
  const to = parseEmailList(input.to, "To");
  const cc = parseEmailList(input.cc ?? "", "CC");
  const bcc = parseEmailList(input.bcc ?? "", "BCC");
  const branding = getEmailBranding(input.tenant);
  const subject = renderEmailSubject({ subject: input.subject, branding, context: input.context });
  const body = renderEmailBody({ body: input.body, branding, context: input.context });

  if (!branding.fromEmail || !emailSchema.safeParse(branding.fromEmail).success) {
    throw new Error("Sender email is not configured correctly. Set RESEND_FROM_EMAIL to a valid verified sender.");
  }

  const { data, error } = await getResendClient().emails.send({
    from: formatSender(branding),
    to,
    cc: cc.length ? cc : undefined,
    bcc: bcc.length ? bcc : undefined,
    subject,
    text: body,
    react: BrandedEmailTemplate({
      branding,
      subject,
      body,
      templateKey: input.templateKey,
      context: input.context,
    }),
    replyTo: branding.replyTo,
    attachments: input.attachments.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
    })),
    tags: [
      { name: "company_id", value: input.tenant.company.id },
      { name: "template", value: input.templateKey },
    ],
  });

  if (error) {
    throw new Error(formatResendError(error));
  }

  return { resendMessageId: data?.id ?? null, fromEmail: branding.fromEmail, subject, body, recipients: to };
}

export function parseEmailList(value: string, label = "Email") {
  const items = value
    .split(/[,\s;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!items.length && label === "To") throw new Error("Recipient email is required.");
  for (const item of items) {
    const parsed = emailSchema.safeParse(item);
    if (!parsed.success) throw new Error(`${label} contains an invalid email address: ${item}`);
  }
  return items;
}

function formatResendError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return `Resend failed: ${String((error as { message?: unknown }).message)}`;
  }
  return "Resend failed to send the email.";
}
