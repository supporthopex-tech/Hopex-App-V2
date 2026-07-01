"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SubmissionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export function CustomerMessageForm({ companySlug }: { companySlug: string }) {
  const [state, setState] = useState<SubmissionState>({ ok: true, message: "" });
  const [pending, setPending] = useState(false);

  async function submitMessage(formData: FormData) {
    setPending(true);
    setState({ ok: true, message: "" });
    try {
      const response = await fetch("/api/public/customer-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(companySlug) ? "companyId" : "companySlug"]: companySlug,
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          subject: formData.get("subject"),
          message: formData.get("message"),
          source: "website_contact_form",
          websiteUrl: window.location.href,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState({
          ok: false,
          message: payload.error ?? "Could not send message. Please try again.",
          fieldErrors: payload.details,
        });
        return;
      }
      setState({ ok: true, message: "Asante. Ujumbe wako umepokelewa." });
      const form = document.querySelector<HTMLFormElement>("#customer-message-form");
      form?.reset();
    } catch {
      setState({ ok: false, message: "Network error. Please check your connection and try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Send us a message</CardTitle>
        <CardDescription>Your message will go directly to the company database.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="customer-message-form" action={submitMessage} className="grid gap-4">
          <FieldError errors={state.fieldErrors?.companySlug} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Customer name" name="name" placeholder="Ali Mohamed" errors={state.fieldErrors?.name} required />
            <Field label="Email" name="email" type="email" placeholder="ali@example.com" errors={state.fieldErrors?.email} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Phone" name="phone" placeholder="+255..." errors={state.fieldErrors?.phone} />
            <Field label="Subject" name="subject" placeholder="Shipment inquiry" errors={state.fieldErrors?.subject} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" placeholder="Write your message..." required />
            <FieldError errors={state.fieldErrors?.message} />
          </div>

          {state.message ? (
            <p className={`rounded-md border p-3 text-sm ${state.ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
              {state.message}
            </p>
          ) : null}

          <Button disabled={pending} className="w-fit">
            <Send className="h-4 w-4" />{pending ? "Sending..." : "Send message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  errors?: string[];
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} required={required} />
      <FieldError errors={errors} />
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
