import { TasksList } from "@/components/operations/tasks-list";
import { listTasks } from "@/lib/operations/service";

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const tasks = await listTasks({ search: params.search, status: params.status, priority: params.priority });
  return <TasksList tasks={tasks} filters={{ search: params.search, status: params.status, priority: params.priority }} />;
}
