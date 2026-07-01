"use client";

import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SubmitState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

export function PublicQuoteRequestForm() {
  const [state, setState] = useState<SubmitState>({ status: "idle", message: "" });

  async function onSubmit(formData: FormData) {
    setState({ status: "loading", message: "Submitting quote request..." });
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/public/quote-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState({ status: "error", message: String(result.error ?? "Could not submit quote request. Please try again.") });
      return;
    }
    setState({ status: "success", message: "Quote request sent. Our team will contact you shortly." });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request a shipping quote</CardTitle>
        <CardDescription>Send cargo details to the operations team for pricing and follow-up.</CardDescription>
      </CardHeader>
      <CardContent>
        {state.message ? (
          <p className={`mb-4 rounded-md border p-3 text-sm ${state.status === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
            {state.message}
          </p>
        ) : null}
        <form action={onSubmit} className="grid gap-4 md:grid-cols-2">
          <Field label="Full name" name="customerName" required />
          <Field label="Phone" name="customerPhone" />
          <Field label="Email" name="customerEmail" type="email" />
          <Field label="Cargo type" name="cargoType" placeholder="Air, sea, container, package..." />
          <Field label="Origin" name="origin" placeholder="Dubai" />
          <Field label="Destination" name="destination" placeholder="Dar es Salaam" />
          <Field label="Estimated weight (kg)" name="estimatedWeight" type="number" min="0" step="0.01" />
          <Field label="Pieces" name="estimatedPieces" type="number" min="0" step="1" />
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="cargoDescription">Cargo description</Label>
            <Textarea id="cargoDescription" name="cargoDescription" placeholder="Describe the goods, dimensions, urgency, pickup notes, or special handling needs." required />
          </div>
          <Button disabled={state.status === "loading"} className="md:w-fit">
            {state.status === "loading" ? "Sending..." : "Submit quote request"}
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
  required = false,
  ...props
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} {...props} />
    </div>
  );
}
