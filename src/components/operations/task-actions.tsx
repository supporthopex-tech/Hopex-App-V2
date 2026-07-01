"use client";

import Link from "next/link";
import { Edit, Eye, Play, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { deleteTask, updateTaskStatus } from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import type { TaskRecord } from "@/lib/operations/types";

export function TaskActions({ task }: { task: TaskRecord }) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button asChild variant="ghost" size="sm"><Link href={`/tasks/${task.id}`}><Eye className="h-4 w-4" />View</Link></Button>
      <form action={updateTaskStatus}><input type="hidden" name="task_id" value={task.id} /><input type="hidden" name="status" value="in_progress" /><Button variant="ghost" size="sm"><Play className="h-4 w-4" />Start</Button></form>
      <Button asChild variant="ghost" size="sm"><Link href={`/tasks/${task.id}?mode=edit`}><Edit className="h-4 w-4" />Edit</Link></Button>
      <form action={updateTaskStatus}><input type="hidden" name="task_id" value={task.id} /><input type="hidden" name="status" value="completed" /><Button variant="ghost" size="sm"><CheckCircle2 className="h-4 w-4" />Done</Button></form>
      <form action={updateTaskStatus}><input type="hidden" name="task_id" value={task.id} /><input type="hidden" name="status" value="cancelled" /><Button variant="ghost" size="sm"><XCircle className="h-4 w-4" />Cancel</Button></form>
      <form action={deleteTask} onSubmit={(event) => { if (!confirm("Delete this task?")) event.preventDefault(); }}>
        <input type="hidden" name="task_id" value={task.id} />
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" />Delete</Button>
      </form>
    </div>
  );
}
