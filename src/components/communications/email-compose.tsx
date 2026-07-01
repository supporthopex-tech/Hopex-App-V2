"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { sendEmail } from "@/app/(app)/email/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { templateOptions, type EmailTemplateKey } from "@/lib/email/templates";
import type { EmailComposeData } from "@/lib/communications/types";

export type EmailComposeDefaults = {
  to?: string;
  templateKey?: string;
  relatedCustomerId?: string;
  relatedShipmentId?: string;
  relatedQuoteId?: string;
  subject?: string;
};

export function EmailCompose({ composeData, defaults = {} }: { composeData: EmailComposeData; defaults?: EmailComposeDefaults }) {
  const [state, action, pending] = useActionState(sendEmail, { ok: true, message: "" });
  const initialTemplate = normalizeTemplate(defaults.templateKey);
  const [templateKey, setTemplateKey] = useState<EmailTemplateKey>(initialTemplate);
  const activeTemplate = useMemo(() => templateOptions.find((template) => template.key === templateKey) ?? templateOptions[0], [templateKey]);
  const [subject, setSubject] = useState(defaults.subject || activeTemplate.subject);
  const [body, setBody] = useState(activeTemplate.body);
  const [to, setTo] = useState(defaults.to ?? "");
  const [customerId, setCustomerId] = useState(defaults.relatedCustomerId ?? "");
  const [shipmentId, setShipmentId] = useState(defaults.relatedShipmentId ?? "");
  const [quoteId, setQuoteId] = useState(defaults.relatedQuoteId ?? "");

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  function applyTemplate(nextKey: EmailTemplateKey) {
    const nextTemplate = templateOptions.find((template) => template.key === nextKey) ?? templateOptions[0];
    setTemplateKey(nextTemplate.key);
    setSubject(nextTemplate.subject);
    setBody(nextTemplate.body);
  }

  function applyRecipient(email?: string, nextCustomerId?: string) {
    if (email) setTo(email);
    if (nextCustomerId) setCustomerId(nextCustomerId);
  }

  return (
    <form action={action} encType="multipart/form-data" className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compose Email</h1>
        <p className="text-sm text-muted-foreground">Send branded customer emails through Resend with logs, attachments, and shipment context.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
          <CardDescription>Choose a template to auto-fill content, then edit anything before sending.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="template_key" value={templateKey} />
        <div className="grid gap-2 md:col-span-2">
          <Label>Template</Label>
          <Select value={templateKey} onChange={(event) => applyTemplate(event.target.value as EmailTemplateKey)}>
            {templateOptions.map((template) => <option key={template.key} value={template.key}>{template.label}</option>)}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>To</Label>
          <Input name="to_email" value={to} onChange={(event) => setTo(event.target.value)} placeholder="customer@example.com" required />
        </div>
        <Field label="CC" name="cc" placeholder="Optional" />
        <Field label="BCC" name="bcc" placeholder="Optional" />
        <div className="grid gap-2">
          <Label>Subject</Label>
          <Input name="subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label>Related Customer</Label>
          <Select name="related_customer_id" value={customerId} onChange={(event) => {
            const selected = composeData.customers.find((customer) => customer.id === event.target.value);
            setCustomerId(event.target.value);
            applyRecipient(selected?.email, selected?.id);
          }}>
            <option value="">None</option>
            {composeData.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.label}</option>)}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Related Shipment</Label>
          <Select name="related_shipment_id" value={shipmentId} onChange={(event) => {
            const selected = composeData.shipments.find((shipment) => shipment.id === event.target.value);
            setShipmentId(event.target.value);
            applyRecipient(selected?.email);
          }}>
            <option value="">None</option>
            {composeData.shipments.map((shipment) => <option key={shipment.id} value={shipment.id}>{shipment.label}</option>)}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Related Quote</Label>
          <Select name="related_quote_id" value={quoteId} onChange={(event) => {
            const selected = composeData.quotes.find((quote) => quote.id === event.target.value);
            setQuoteId(event.target.value);
            applyRecipient(selected?.email);
          }}>
            <option value="">None</option>
            {composeData.quotes.map((quote) => <option key={quote.id} value={quote.id}>{quote.label}</option>)}
          </Select>
        </div>
        <Field label="Related Invoice ID" name="related_invoice_id" placeholder="Optional invoice UUID" />
        <div className="grid gap-2 md:col-span-2">
          <Label>Message</Label>
          <Textarea name="body" rows={12} value={body} onChange={(event) => setBody(event.target.value)} />
          <p className="text-xs text-muted-foreground">Available placeholders include {"{{company_name}}"}, {"{{customer_name}}"}, {"{{tracking_number}}"}, {"{{shipment_status}}"}, {"{{tracking_link}}"}, and {"{{quote_amount}}"}.</p>
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label>Attachments</Label>
          <Input type="file" name="attachments" multiple />
          <p className="text-xs text-muted-foreground">PDF, images, Word, and Excel files are supported. Each file must be 10MB or smaller.</p>
        </div>
        {!state.ok ? <p className="text-sm text-destructive md:col-span-2">{state.message}</p> : null}
      </CardContent>
      </Card>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/95 py-4"><Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>Save draft</Button><Button type="submit" name="intent" value="send" disabled={pending}>{pending ? "Sending..." : "Send email"}</Button></div>
    </form>
  );
}

function Field({ label, name, required, placeholder }: { label: string; name: string; required?: boolean; placeholder?: string }) {
  return <div className="grid gap-2"><Label>{label}</Label><Input name={name} required={required} placeholder={placeholder} /></div>;
}

function normalizeTemplate(value?: string): EmailTemplateKey {
  return templateOptions.some((template) => template.key === value) ? (value as EmailTemplateKey) : "general";
}
