import { EmailModule } from "@/components/communications/email-module";
import { getEmailData } from "@/lib/communications/service";

export default async function TrashPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  return <EmailModule {...await getEmailData("trash", params.search ?? "")} folder="trash" search={params.search} />;
}
