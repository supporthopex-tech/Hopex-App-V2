import { EmailLogs } from "@/components/communications/email-logs";
import { getEmailLogs } from "@/lib/communications/service";

export default async function EmailLogsPage() {
  return <EmailLogs logs={await getEmailLogs()} />;
}
