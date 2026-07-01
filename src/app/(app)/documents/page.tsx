import { DocumentsList } from "@/components/documents/documents-list";
import { listDocuments } from "@/lib/documents/service";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const search = params.search ?? "";
  return <DocumentsList documents={await listDocuments(search)} search={search} />;
}
