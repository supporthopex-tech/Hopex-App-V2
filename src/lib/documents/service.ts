import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext, hasPermission, isSupabaseConfigured } from "@/lib/tenant";

export type DocumentSource = "shipment" | "quote" | "email";

export type DocumentRecord = {
  id: string;
  source: DocumentSource;
  bucket: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  category: string;
  relatedId: string;
  relatedLabel: string;
  createdAt: string;
  canDelete: boolean;
};

type QueryClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
    };
  };
};

export async function listDocuments(search = "") {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return [];

  const supabase = (await createClient()) as unknown as QueryClient;
  const [shipmentDocs, quoteDocs, emailDocs] = await Promise.all([
    hasPermission(tenant, "shipments.view")
      ? supabase.from("shipment_documents").select("*").order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    hasPermission(tenant, "quotes.view")
      ? supabase.from("quote_documents").select("*").order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    hasPermission(tenant, "email.view")
      ? supabase.from("email_attachments").select("*").order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const firstError = shipmentDocs.error ?? quoteDocs.error ?? emailDocs.error;
  if (firstError) throw new Error(firstError.message);

  const documents = [
    ...(shipmentDocs.data ?? []).map((row) => mapDocument(row, "shipment", "shipment-documents", hasPermission(tenant, "shipments.manage_documents"))),
    ...(quoteDocs.data ?? []).map((row) => mapDocument(row, "quote", "quote-documents", hasPermission(tenant, "quotes.edit"))),
    ...(emailDocs.data ?? []).map((row) => mapDocument(row, "email", "email-attachments", hasPermission(tenant, "email.manage"))),
  ].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const query = search.trim().toLowerCase();
  if (!query) return documents;
  return documents.filter((document) =>
    [document.fileName, document.fileType, document.category, document.relatedLabel, document.source]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
}

function mapDocument(row: Record<string, unknown>, source: DocumentSource, bucket: string, canDelete: boolean): DocumentRecord {
  return {
    id: String(row.id),
    source,
    bucket,
    fileName: String(row.file_name ?? ""),
    filePath: String(row.file_path ?? ""),
    fileType: String(row.mime_type ?? row.file_type ?? ""),
    fileSize: Number(row.size_bytes ?? row.file_size ?? 0),
    category: String(row.document_type ?? source),
    relatedId: String(row.shipment_id ?? row.quote_request_id ?? row.email_message_id ?? ""),
    relatedLabel: String(row.shipment_id ?? row.quote_request_id ?? row.email_message_id ?? ""),
    createdAt: String(row.created_at ?? ""),
    canDelete,
  };
}
