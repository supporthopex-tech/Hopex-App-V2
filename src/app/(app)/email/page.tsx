import { EmailModule } from "@/components/communications/email-module";
import { getEmailData } from "@/lib/communications/service";

export default async function EmailPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const data = await getEmailData("inbox", params.search ?? "");
  return <EmailModule {...data} folder="inbox" search={params.search} />;
}
