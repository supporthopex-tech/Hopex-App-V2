import { SearchResults } from "@/components/search/search-results";
import { globalSearch } from "@/lib/search/service";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const query = params.q ?? "";
  return <SearchResults query={query} results={await globalSearch(query)} />;
}
