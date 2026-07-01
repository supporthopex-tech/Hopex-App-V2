import { EmailModule } from "@/components/communications/email-module";
import { getEmailData } from "@/lib/communications/service";

export default async function SentPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  return <EmailModule {...await getEmailData("sent", params.search ?? "")} folder="sent" search={params.search} />;
}
