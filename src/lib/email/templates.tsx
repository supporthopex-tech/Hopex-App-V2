/* eslint-disable @next/next/no-head-element, @next/next/no-img-element */
import type { EmailBranding } from "@/lib/email/branding";

export const emailTemplateKeys = [
  "general",
  "quote",
  "shipment-status",
  "invoice-payment",
  "welcome-customer",
  "staff-approval",
] as const;

export type EmailTemplateKey = (typeof emailTemplateKeys)[number];

export type EmailTemplateContext = {
  customerName?: string;
  message: string;
  quote?: {
    id?: string;
    amount?: string;
    origin?: string;
    destination?: string;
    cargoDescription?: string;
  };
  shipment?: {
    trackingNumber?: string;
    status?: string;
    origin?: string;
    destination?: string;
    estimatedDelivery?: string;
    trackingLink?: string;
    qrCodeUrl?: string;
  };
  invoice?: {
    invoiceNumber?: string;
    amountDue?: string;
    dueDate?: string;
    paymentLink?: string;
  };
  approval?: {
    title?: string;
    status?: string;
    actorName?: string;
  };
};

export type TemplateOption = {
  key: EmailTemplateKey;
  label: string;
  subject: string;
  body: string;
};

export const templateOptions: TemplateOption[] = [
  {
    key: "general",
    label: "General message",
    subject: "Message from {{company_name}}",
    body: "Hello {{customer_name}},\n\n{{message}}\n\nRegards,\n{{company_name}}",
  },
  {
    key: "quote",
    label: "Quote email",
    subject: "Your quote from {{company_name}}",
    body: "Hello {{customer_name}},\n\nYour cargo quote is ready.\n\nRoute: {{origin}} to {{destination}}\nCargo: {{cargo_description}}\nAmount: {{quote_amount}}\n\n{{message}}\n\nRegards,\n{{company_name}}",
  },
  {
    key: "shipment-status",
    label: "Shipment status update",
    subject: "Shipment {{tracking_number}} is {{shipment_status}}",
    body: "Hello {{customer_name}},\n\nYour shipment {{tracking_number}} is now {{shipment_status}}.\n\nOrigin: {{origin}}\nDestination: {{destination}}\nEstimated delivery: {{estimated_delivery}}\nTracking link: {{tracking_link}}\n\n{{message}}\n\nRegards,\n{{company_name}}",
  },
  {
    key: "invoice-payment",
    label: "Invoice/payment email",
    subject: "Invoice update from {{company_name}}",
    body: "Hello {{customer_name}},\n\nInvoice: {{invoice_number}}\nAmount due: {{amount_due}}\nDue date: {{due_date}}\nPayment link: {{payment_link}}\n\n{{message}}\n\nRegards,\n{{company_name}}",
  },
  {
    key: "welcome-customer",
    label: "Welcome/customer registration",
    subject: "Welcome to {{company_name}}",
    body: "Hello {{customer_name}},\n\nWelcome to {{company_name}}. We are happy to support your cargo and logistics needs.\n\n{{message}}\n\nRegards,\n{{company_name}}",
  },
  {
    key: "staff-approval",
    label: "Staff approval notification",
    subject: "Approval notification from {{company_name}}",
    body: "Hello,\n\nApproval: {{approval_title}}\nStatus: {{approval_status}}\nUpdated by: {{actor_name}}\n\n{{message}}\n\nRegards,\n{{company_name}}",
  },
];

export function renderEmailSubject(input: { subject: string; branding: EmailBranding; context: EmailTemplateContext }) {
  return fillPlaceholders(input.subject, input.branding, input.context).trim();
}

export function renderEmailBody(input: { body: string; branding: EmailBranding; context: EmailTemplateContext }) {
  return fillPlaceholders(input.body, input.branding, input.context).trim();
}

export function BrandedEmailTemplate({
  branding,
  subject,
  body,
  templateKey,
  context,
}: {
  branding: EmailBranding;
  subject: string;
  body: string;
  templateKey: EmailTemplateKey;
  context: EmailTemplateContext;
}) {
  const preheader = subject.slice(0, 120);
  const lines = body.split(/\r?\n/);
  const accent = branding.primaryColor || "#2563eb";

  return (
    <html>
      <head>
        <title>{subject}</title>
      </head>
      <body style={{ margin: 0, backgroundColor: "#f4f7fb", fontFamily: "Arial, sans-serif", color: "#111827" }}>
        <div style={{ display: "none", overflow: "hidden", lineHeight: "1px", opacity: 0, maxHeight: 0, maxWidth: 0 }}>
          {preheader}
        </div>
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: "#f4f7fb", padding: "32px 12px" }}>
          <tbody>
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ maxWidth: 640, overflow: "hidden", borderRadius: 24, backgroundColor: "#ffffff", boxShadow: "0 18px 55px rgba(15,23,42,0.10)" }}>
                  <tbody>
                    <tr>
                      <td style={{ background: `linear-gradient(135deg, ${accent}, #111827)`, padding: "28px 32px" }}>
                        {branding.logoUrl ? (
                          <img src={branding.logoUrl} alt={branding.companyName} style={{ maxHeight: 48, maxWidth: 180, objectFit: "contain", display: "block", marginBottom: 18 }} />
                        ) : null}
                        <div style={{ color: "#ffffff", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.8 }}>
                          {templateLabel(templateKey)}
                        </div>
                        <h1 style={{ color: "#ffffff", fontSize: 28, lineHeight: "34px", margin: "10px 0 0", fontWeight: 700 }}>
                          {subject}
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "32px" }}>
                        {context.shipment ? <ShipmentSummary shipment={context.shipment} accent={accent} /> : null}
                        {context.quote ? <QuoteSummary quote={context.quote} accent={accent} /> : null}
                        {context.invoice ? <InvoiceSummary invoice={context.invoice} accent={accent} /> : null}
                        <div style={{ fontSize: 15, lineHeight: "26px", color: "#334155" }}>
                          {lines.map((line, index) =>
                            line.trim() ? (
                              <p key={`${line}-${index}`} style={{ margin: "0 0 14px" }}>
                                {line}
                              </p>
                            ) : (
                              <div key={`spacer-${index}`} style={{ height: 8 }} />
                            ),
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderTop: "1px solid #e5e7eb", padding: "22px 32px", backgroundColor: "#f8fafc" }}>
                        <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#111827" }}>{branding.companyName}</p>
                        <p style={{ margin: 0, fontSize: 12, lineHeight: "19px", color: "#64748b" }}>
                          {[branding.address, branding.phone, branding.replyTo, branding.website].filter(Boolean).join(" · ")}
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

function ShipmentSummary({ shipment, accent }: { shipment: NonNullable<EmailTemplateContext["shipment"]>; accent: string }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 18, marginBottom: 24 }}>
      <SummaryTitle label="Shipment details" accent={accent} />
      <SummaryGrid
        items={[
          ["Shipment", shipment.trackingNumber],
          ["Status", shipment.status],
          ["Origin", shipment.origin],
          ["Destination", shipment.destination],
          ["Estimated delivery", shipment.estimatedDelivery],
        ]}
      />
      {shipment.trackingLink ? <ActionLink href={shipment.trackingLink} label="Track shipment" accent={accent} /> : null}
      {shipment.qrCodeUrl ? <img src={shipment.qrCodeUrl} alt="Shipment QR code" style={{ marginTop: 16, width: 96, height: 96 }} /> : null}
    </div>
  );
}

function QuoteSummary({ quote, accent }: { quote: NonNullable<EmailTemplateContext["quote"]>; accent: string }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 18, marginBottom: 24 }}>
      <SummaryTitle label="Quote details" accent={accent} />
      <SummaryGrid items={[["Route", [quote.origin, quote.destination].filter(Boolean).join(" to ")], ["Cargo", quote.cargoDescription], ["Amount", quote.amount]]} />
    </div>
  );
}

function InvoiceSummary({ invoice, accent }: { invoice: NonNullable<EmailTemplateContext["invoice"]>; accent: string }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 18, marginBottom: 24 }}>
      <SummaryTitle label="Payment details" accent={accent} />
      <SummaryGrid items={[["Invoice", invoice.invoiceNumber], ["Amount due", invoice.amountDue], ["Due date", invoice.dueDate]]} />
      {invoice.paymentLink ? <ActionLink href={invoice.paymentLink} label="View payment" accent={accent} /> : null}
    </div>
  );
}

function SummaryTitle({ label, accent }: { label: string; accent: string }) {
  return <p style={{ margin: "0 0 12px", color: accent, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</p>;
}

function SummaryGrid({ items }: { items: Array<[string, string | undefined]> }) {
  return (
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
      <tbody>
        {items.filter(([, value]) => Boolean(value)).map(([label, value]) => (
          <tr key={label}>
            <td style={{ padding: "7px 0", color: "#64748b", fontSize: 13 }}>{label}</td>
            <td align="right" style={{ padding: "7px 0", color: "#111827", fontSize: 13, fontWeight: 700 }}>
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ActionLink({ href, label, accent }: { href: string; label: string; accent: string }) {
  return (
    <a href={href} style={{ display: "inline-block", marginTop: 16, borderRadius: 999, backgroundColor: accent, color: "#ffffff", padding: "11px 18px", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
      {label}
    </a>
  );
}

function fillPlaceholders(template: string, branding: EmailBranding, context: EmailTemplateContext) {
  const replacements: Record<string, string> = {
    company_name: branding.companyName,
    customer_name: context.customerName || "Customer",
    message: context.message || "",
    origin: context.shipment?.origin || context.quote?.origin || "",
    destination: context.shipment?.destination || context.quote?.destination || "",
    cargo_description: context.quote?.cargoDescription || "",
    quote_amount: context.quote?.amount || "",
    tracking_number: context.shipment?.trackingNumber || "",
    shipment_status: context.shipment?.status || "",
    estimated_delivery: context.shipment?.estimatedDelivery || "",
    tracking_link: context.shipment?.trackingLink || "",
    invoice_number: context.invoice?.invoiceNumber || "",
    amount_due: context.invoice?.amountDue || "",
    due_date: context.invoice?.dueDate || "",
    payment_link: context.invoice?.paymentLink || "",
    approval_title: context.approval?.title || "",
    approval_status: context.approval?.status || "",
    actor_name: context.approval?.actorName || "",
  };

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => replacements[key] ?? "");
}

function templateLabel(key: EmailTemplateKey) {
  return templateOptions.find((template) => template.key === key)?.label ?? "Email";
}
