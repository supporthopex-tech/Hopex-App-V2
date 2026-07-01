import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireDocumentAccess } from "@/app/(app)/documents/actions";
import type { DocumentSource } from "@/lib/documents/service";

type QueryClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> };
    };
  };
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (path: string, expiresIn: number, options?: { download?: string }) => Promise<{ data: { signedUrl?: string } | null; error: { message: string } | null }>;
    };
  };
};

const documentConfig = {
  shipment: { table: "shipment_documents", bucket: "shipment-documents" },
  quote: { table: "quote_documents", bucket: "quote-documents" },
  email: { table: "email_attachments", bucket: "email-attachments" },
} satisfies Record<DocumentSource, { table: string; bucket: string }>;

export async function GET(_request: Request, { params }: { params: Promise<{ source: string; id: string }> }) {
  const { source: sourceParam, id } = await params;
  const source = sourceParam as DocumentSource;
  const config = documentConfig[source];
  if (!config || !id) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  await requireDocumentAccess(source);
  const supabase = (await createClient()) as unknown as QueryClient;
  const { data, error } = await supabase.from(config.table).select("file_name,file_path").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const signed = await supabase.storage
    .from(config.bucket)
    .createSignedUrl(String(data.file_path ?? ""), 60, { download: String(data.file_name ?? "document") });
  if (signed.error || !signed.data?.signedUrl) return NextResponse.json({ error: "Could not prepare document link" }, { status: 503 });
  return NextResponse.redirect(signed.data.signedUrl);
}
