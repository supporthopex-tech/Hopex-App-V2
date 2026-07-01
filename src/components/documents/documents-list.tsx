import Link from "next/link";
import { Download, FileText, Search, Trash2 } from "lucide-react";
import { deleteDocument } from "@/app/(app)/documents/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DocumentRecord } from "@/lib/documents/service";

export function DocumentsList({ documents, search }: { documents: DocumentRecord[]; search: string }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">Central document workspace for shipment, quote, and email files.</p>
        </div>
        <Badge variant="secondary">{documents.length} files</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="relative max-w-xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" name="search" defaultValue={search} placeholder="Search documents..." />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document library</CardTitle>
          <CardDescription>Signed links are generated on demand and expire quickly.</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No documents found.</div>
          ) : (
            <>
              <div className="grid gap-3 lg:hidden">
                {documents.map((document) => <DocumentCard key={`${document.source}-${document.id}`} document={document} />)}
              </div>
              <div className="hidden overflow-x-auto lg:block">
                <Table className="min-w-[920px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Related record</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((document) => (
                      <TableRow key={`${document.source}-${document.id}`}>
                        <TableCell><FileName document={document} /></TableCell>
                        <TableCell><Badge variant="outline">{document.source}</Badge></TableCell>
                        <TableCell>{document.category.replaceAll("_", " ")}</TableCell>
                        <TableCell className="font-mono text-xs">{document.relatedLabel || "-"}</TableCell>
                        <TableCell>{formatBytes(document.fileSize)}</TableCell>
                        <TableCell>{formatDate(document.createdAt)}</TableCell>
                        <TableCell className="text-right"><DocumentActions document={document} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentCard({ document }: { document: DocumentRecord }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <FileName document={document} />
        <Badge variant="outline">{document.source}</Badge>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <Row label="Category" value={document.category.replaceAll("_", " ")} />
        <Row label="Related" value={document.relatedLabel || "-"} />
        <Row label="Size" value={formatBytes(document.fileSize)} />
        <Row label="Created" value={formatDate(document.createdAt)} />
      </div>
      <div className="mt-4 border-t pt-3"><DocumentActions document={document} /></div>
    </div>
  );
}

function FileName({ document }: { document: DocumentRecord }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 font-medium"><FileText className="h-4 w-4" />{document.fileName}</p>
      <p className="truncate text-xs text-muted-foreground">{document.fileType || document.bucket}</p>
    </div>
  );
}

function DocumentActions({ document }: { document: DocumentRecord }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/api/documents/${document.source}/${document.id}/download`} target="_blank">
          <Download className="h-4 w-4" />
          View
        </Link>
      </Button>
      {document.canDelete ? (
        <form action={deleteDocument}>
          <input type="hidden" name="source" value={document.source} />
          <input type="hidden" name="document_id" value={document.id} />
          <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}

function formatBytes(value: number) {
  if (!value) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
