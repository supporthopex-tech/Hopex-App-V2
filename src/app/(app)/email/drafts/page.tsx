import { EmailModule } from "@/components/communications/email-module";
import { getEmailData } from "@/lib/communications/service";

export default async function DraftsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  return <EmailModule {...await getEmailData("drafts", params.search ?? "")} folder="drafts" search={params.search} />;
}
