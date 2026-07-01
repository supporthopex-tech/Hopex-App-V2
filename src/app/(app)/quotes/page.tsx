import { QuotesList } from "@/components/operations/quotes-list";
import { listQuoteRequests } from "@/lib/operations/service";

export default async function QuotesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const quotes = await listQuoteRequests({ search: params.search, status: params.status });
  return <QuotesList quotes={quotes} filters={{ search: params.search, status: params.status }} />;
}
