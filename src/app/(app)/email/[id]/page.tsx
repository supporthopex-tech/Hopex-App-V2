import { notFound } from "next/navigation";
import { EmailModule } from "@/components/communications/email-module";
import { getEmailById, getEmailData } from "@/lib/communications/service";

export default async function EmailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const email = await getEmailById(id);
  if (!email) notFound();
  const data = await getEmailData(email.folder);
  return <EmailModule {...data} folder={email.folder} selectedEmail={email} />;
}
