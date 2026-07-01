"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAnyPermission, requirePermission } from "@/lib/tenant";
import type { DocumentSource } from "@/lib/documents/service";

type MutationClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> };
    };
    delete: () => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
  };
  storage: {
    from: (bucket: string) => {
      remove: (paths: string[]) => Promise<{ error: { message: string } | null }>;
    };
  };
};

const documentConfig = {
  shipment: { table: "shipment_documents", bucket: "shipment-documents", permission: "shipments.manage_documents" },
  quote: { table: "quote_documents", bucket: "quote-documents", permission: "quotes.edit" },
  email: { table: "email_attachments", bucket: "email-attachments", permission: "email.manage" },
} satisfies Record<DocumentSource, { table: string; bucket: string; permission: string }>;

export async function deleteDocument(formData: FormData) {
  const source = String(formData.get("source") ?? "") as DocumentSource;
  const id = String(formData.get("document_id") ?? "");
  const config = documentConfig[source];
  if (!config || !id) throw new Error("Invalid document delete request.");

  await requirePermission(config.permission);
  const supabase = (await createClient()) as unknown as MutationClient;
  const { data, error } = await supabase.from(config.table).select("file_path").eq("id", id).single();
  if (error || !data) throw new Error(error?.message ?? "Document not found.");

  const filePath = String(data.file_path ?? "");
  if (filePath) {
    const remove = await supabase.storage.from(config.bucket).remove([filePath]);
    if (remove.error) throw new Error(remove.error.message);
  }
  const deleted = await supabase.from(config.table).delete().eq("id", id);
  if (deleted.error) throw new Error(deleted.error.message);
  revalidatePath("/documents");
}

export async function requireDocumentAccess(source: DocumentSource) {
  if (source === "shipment") return requireAnyPermission(["shipments.view", "shipments.manage_documents"]);
  if (source === "quote") return requireAnyPermission(["quotes.view", "quotes.edit"]);
  return requireAnyPermission(["email.view", "email.manage"]);
}
