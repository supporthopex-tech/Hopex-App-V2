import { TaskForm } from "@/components/operations/task-form";
import { listStaff } from "@/lib/staff/service";

export default async function NewTaskPage() {
  const { staff } = await listStaff();
  return <TaskForm staff={staff} />;
}
