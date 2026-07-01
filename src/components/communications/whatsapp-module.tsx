"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, MessageCircle } from "lucide-react";
import { logWhatsAppMessage, saveWhatsAppTemplate } from "@/app/(app)/whatsapp/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { whatsappMessageTypes, type WhatsAppMessageRecord, type WhatsAppTemplateRecord } from "@/lib/communications/types";
import type { TenantContext } from "@/lib/app-types";

export function WhatsAppModule({ tab, messages, templates, tenant }: { tab: string; messages: WhatsAppMessageRecord[]; templates: WhatsAppTemplateRecord[]; tenant: TenantContext }) {
  const [phone, setPhone] = useState("+971500000021");
  const [customerName, setCustomerName] = useState("Customer");
  const [messageType, setMessageType] = useState("Shipment Update");
  const [tracking, setTracking] = useState("NSC-2026-00046");
  const [destination, setDestination] = useState("Riyadh");
  const [eta, setEta] = useState("2026-06-22");
  const [custom, setCustom] = useState("");
  const preview = useMemo(() => custom || `Hello ${customerName}, shipment ${tracking} is ${messageType.toLowerCase()} to ${destination}. ETA: ${eta}. ${tenant.company.name}`, [custom, customerName, tracking, messageType, destination, eta, tenant.company.name]);
  const waLink = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(preview)}`;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">WhatsApp Notifications</h1><p className="text-sm text-muted-foreground">Send updates to customers via WhatsApp</p></div>
      <div className="flex flex-wrap gap-2">{["manual", "bulk", "templates", "log"].map((item) => <Button key={item} asChild variant={tab === item ? "default" : "outline"} size="sm"><Link href={`/whatsapp/${item === "manual" ? "" : item}`.replace(/\/$/, "")}>{item[0].toUpperCase() + item.slice(1)}</Link></Button>)}</div>
      {tab === "templates" ? <Templates templates={templates} /> : tab === "log" ? <Log messages={messages} /> : tab === "bulk" ? <Bulk /> : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card><CardHeader><CardTitle>Manual compose</CardTitle><CardDescription>Customer and shipment fields can be auto-filled from ERP data.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Select customer" value={customerName} onChange={setCustomerName} /><Field label="Manual phone" value={phone} onChange={setPhone} />
            <div className="grid gap-2"><Label>Message type</Label><Select value={messageType} onChange={(event) => setMessageType(event.target.value)}>{whatsappMessageTypes.map((type) => <option key={type} value={type}>{type}</option>)}</Select></div>
            <Field label="Tracking number" value={tracking} onChange={setTracking} /><Field label="Destination" value={destination} onChange={setDestination} /><Field label="ETA / Date" value={eta} onChange={setEta} />
            <div className="grid gap-2 md:col-span-2"><Label>Custom message body</Label><Textarea value={custom} onChange={(event) => setCustom(event.target.value)} /></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Message preview</CardTitle><CardDescription>Link-based WhatsApp sending first; API settings are ready for future integration.</CardDescription></CardHeader><CardContent className="space-y-4">
            <div className="rounded-md border bg-background p-4 text-sm leading-6">{preview}</div>
            <form action={logWhatsAppMessage} className="flex flex-wrap gap-2"><input type="hidden" name="phone" value={phone} /><input type="hidden" name="message_type" value={messageType} /><input type="hidden" name="message_body" value={preview} /><Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(preview)}><Copy className="h-4 w-4" />Copy</Button><Button asChild><a href={waLink} target="_blank"><MessageCircle className="h-4 w-4" />Send via WhatsApp</a></Button><Button variant="outline"><ExternalLink className="h-4 w-4" />Log message</Button></form>
          </CardContent></Card>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="grid gap-2"><Label>{label}</Label><Input value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function Templates({ templates }: { templates: WhatsAppTemplateRecord[] }) {
  return <div className="grid gap-4 xl:grid-cols-[1fr_1fr]"><Card><CardHeader><CardTitle>Templates</CardTitle><CardDescription>Variables: customer, tracking, status, destination, ETA, company, link, amount.</CardDescription></CardHeader><CardContent className="space-y-3">{templates.map((template) => <div key={template.id} className="rounded-md border p-3"><p className="font-medium">{template.templateName}</p><p className="text-sm text-muted-foreground">{template.body}</p></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Create template</CardTitle></CardHeader><CardContent><form action={saveWhatsAppTemplate} className="grid gap-3"><Input name="template_name" placeholder="Template name" /><Select name="message_type">{whatsappMessageTypes.map((type) => <option key={type}>{type}</option>)}</Select><Textarea name="body" placeholder="Hello {{customer_name}}..." /><Button>Save template</Button></form></CardContent></Card></div>;
}

function Log({ messages }: { messages: WhatsAppMessageRecord[] }) {
  return <Card><CardHeader><CardTitle>Message logs</CardTitle></CardHeader><CardContent className="space-y-3">{messages.map((message) => <div key={message.id} className="rounded-md border p-3"><div className="flex justify-between gap-3"><p className="font-medium">{message.customerName || message.phone}</p><span className="text-xs text-muted-foreground">{message.status}</span></div><p className="text-sm text-muted-foreground">{message.messageBody}</p></div>)}</CardContent></Card>;
}

function Bulk() {
  return <Card><CardHeader><CardTitle>Bulk send-ready workflow</CardTitle><CardDescription>Prepare customer groups and generate WhatsApp-ready messages.</CardDescription></CardHeader><CardContent><div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Bulk workflow is prepared for customer selection and future WhatsApp Business API dispatch.</div></CardContent></Card>;
}
