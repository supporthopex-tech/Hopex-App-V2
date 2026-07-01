import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SearchResult } from "@/lib/search/service";

export function SearchResults({ query, results }: { query: string; results: SearchResult[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">Search shipments, customers, quotes, staff, email, and documents.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" name="q" defaultValue={query} placeholder="Search Hopex..." />
            </div>
            <Button>Search</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>{query ? `${results.length} matches for "${query}"` : "Enter a search term."}</CardDescription>
        </CardHeader>
        <CardContent>
          {!query ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Start with a tracking number, customer, quote, staff member, subject, or file name.</div>
          ) : results.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No results found.</div>
          ) : (
            <div className="grid gap-3">
              {results.map((result) => (
                <Link key={`${result.module}-${result.id}`} href={result.href} className="rounded-lg border bg-background p-4 transition-colors hover:bg-muted/40">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold">{result.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{result.description}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Badge variant="outline">{result.module}</Badge>
                      {result.meta ? <Badge variant="secondary">{result.meta}</Badge> : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
