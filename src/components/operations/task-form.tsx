"use client";

import { useActionState } from "react";
import { createTask } from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { taskPriorities, taskStatuses } from "@/lib/operations/types";
import type { StaffRecord } from "@/lib/staff/types";

export function TaskForm({ staff }: { staff: StaffRecord[] }) {
  const [state, formAction, pending] = useActionState(createTask, { ok: true, message: "" });
  return (
    <form action={formAction} className="mx-auto max-w-4xl space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Create task</h1><p className="text-sm text-muted-foreground">Assign work, priority, due date, notes, and attachments context.</p></div>
      <Card><CardHeader><CardTitle>Task details</CardTitle><CardDescription>Team assignment and status.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="Task title" name="title" required />
        <div className="grid gap-2"><Label>Assigned staff</Label><Select name="assignee_id" required><option value="">Select staff member</option>{staff.filter((member) => member.status === "active").map((member) => <option key={member.id} value={member.id}>{member.staffId} · {member.fullName}</option>)}</Select></div>
        <Field label="Due date" name="due_date" type="date" />
        <div className="grid gap-2"><Label>Priority</Label><Select name="priority">{taskPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</Select></div>
        <div className="grid gap-2"><Label>Status</Label><Select name="status">{taskStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</Select></div>
        <div className="grid gap-2 md:col-span-2"><Label>Description</Label><Textarea name="description" /></div>
        <div className="grid gap-2 md:col-span-2"><Label>Notes</Label><Textarea name="notes" /></div>
        {!state.ok ? <p className="text-sm text-destructive md:col-span-2">{state.message}</p> : null}
      </CardContent></Card>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/95 py-4"><Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create task"}</Button></div>
    </form>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return <div className="grid gap-2"><Label>{label}</Label><Input name={name} type={type} required={required} /></div>;
}
