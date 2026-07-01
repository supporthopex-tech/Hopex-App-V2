import { notFound } from "next/navigation";
import { updateTask } from "@/app/(app)/tasks/actions";
import { PriorityBadge, StatusBadge } from "@/components/operations/badges";
import { TaskActions } from "@/components/operations/task-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getTask } from "@/lib/operations/service";
import { taskPriorities } from "@/lib/operations/types";
import { listStaff } from "@/lib/staff/service";

export default async function TaskDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const [task, staffResult] = await Promise.all([getTask(id), listStaff()]);
  if (!task) notFound();
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1><PriorityBadge priority={task.priority} /><StatusBadge status={task.status} /></div><p className="text-sm text-muted-foreground">{task.description}</p></div><TaskActions task={task} /></div>
      <div className="grid gap-4 lg:grid-cols-4"><Metric label="Assigned staff" value={task.assigneeName} /><Metric label="Due date" value={task.dueDate || "-"} /><Metric label="Comments" value={String(task.commentsCount)} /><Metric label="Attachments" value={String(task.attachmentsCount)} /></div>
      <Card><CardHeader><CardTitle>Task notes</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{task.notes || "No notes."}</CardContent></Card>
      {query.mode === "edit" ? (
        <Card><CardHeader><CardTitle>Edit task</CardTitle></CardHeader><CardContent><form action={updateTask} className="grid gap-4 md:grid-cols-2"><input type="hidden" name="task_id" value={task.id} /><Field label="Title" name="title" value={task.title} /><div className="grid gap-2"><Label>Assigned staff</Label><Select name="assignee_id" defaultValue={task.assigneeId ?? ""}><option value="">Unassigned</option>{staffResult.staff.filter((member) => member.status === "active").map((member) => <option key={member.id} value={member.id}>{member.staffId} · {member.fullName}</option>)}</Select></div><Field label="Due date" name="due_date" value={task.dueDate} type="date" /><div className="grid gap-2"><Label>Priority</Label><Select name="priority" defaultValue={task.priority}>{taskPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</Select></div><div className="grid gap-2 md:col-span-2"><Label>Description</Label><Textarea name="description" defaultValue={task.description} /></div><div className="grid gap-2 md:col-span-2"><Label>Notes</Label><Textarea name="notes" defaultValue={task.notes} /></div><Button className="md:w-fit">Save changes</Button></form></CardContent></Card>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader><CardContent className="font-semibold">{value}</CardContent></Card>;
}

function Field({ label, name, value, type = "text" }: { label: string; name: string; value: string; type?: string }) {
  return <div className="grid gap-2"><Label>{label}</Label><Input name={name} defaultValue={value} type={type} /></div>;
}
