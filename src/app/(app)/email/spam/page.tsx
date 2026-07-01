import { EmailModule } from "@/components/communications/email-module";
import { getEmailData } from "@/lib/communications/service";

export default async function SpamPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  return <EmailModule {...await getEmailData("spam", params.search ?? "")} folder="spam" search={params.search} />;
}
