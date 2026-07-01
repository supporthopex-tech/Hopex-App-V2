import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/operations/badges";
import { TaskActions } from "@/components/operations/task-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { countByStatus } from "@/lib/operations/service";
import { taskPriorities, taskStatuses, type ListFilters, type TaskRecord } from "@/lib/operations/types";

export function TasksList({ tasks, filters }: { tasks: TaskRecord[]; filters: ListFilters }) {
  const tabs = countByStatus(tasks, taskStatuses);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Tasks</h1><p className="text-sm text-muted-foreground">Manage team tasks and assignments</p></div>
        <Button asChild><Link href="/tasks/new"><Plus className="h-4 w-4" />New Task</Link></Button>
      </div>
      <Card><CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap gap-2">{tabs.map((tab) => <Button key={tab.value} asChild variant={(filters.status ?? "all") === tab.value ? "default" : "outline"} size="sm"><Link href={`/tasks?status=${tab.value}`}>{tab.label} <span className="ml-1 opacity-70">{tab.count}</span></Link></Button>)}</div>
        <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" name="search" defaultValue={filters.search} placeholder="Search tasks..." /></div><Select name="priority" defaultValue={filters.priority ?? "all"}><option value="all">All priority</option>{taskPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</Select><Button>Apply filters</Button></form>
      </CardContent></Card>
      <div className="grid gap-4">
        {tasks.length === 0 ? <Card><CardContent className="pt-6"><div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No tasks found.</div></CardContent></Card> : tasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{task.title}</h2><PriorityBadge priority={task.priority} /><StatusBadge status={task.status} /></div><p className="mt-2 text-sm text-muted-foreground">{task.description}</p></div>
                <TaskActions task={task} />
              </div>
              <div className="grid gap-2 text-sm md:grid-cols-4"><Row label="Assigned staff" value={task.assigneeName} /><Row label="Due date" value={dueLabel(task.dueDate, task.status)} /><Row label="Created by" value={task.createdByName} /><Row label="Files / comments" value={`${task.attachmentsCount} files · ${task.commentsCount} comments`} /></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function dueLabel(date: string, status: string) {
  if (!date) return "-";
  const overdue = status !== "completed" && new Date(date) < new Date();
  return overdue ? `${date} · overdue` : date;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>;
}
