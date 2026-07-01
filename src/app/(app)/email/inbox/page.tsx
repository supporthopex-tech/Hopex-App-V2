import { EmailModule } from "@/components/communications/email-module";
import { getEmailData } from "@/lib/communications/service";

export default async function InboxPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  return <EmailModule {...await getEmailData("inbox", params.search ?? "")} folder="inbox" search={params.search} />;
}
