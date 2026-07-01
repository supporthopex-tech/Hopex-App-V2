"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ActionState = "idle" | "preview" | "print" | "download";

export function PackingListPdfActions({
  packingListId,
  packingListNumber,
}: {
  packingListId: string;
  packingListNumber: string;
}) {
  const [busy, setBusy] = useState<ActionState>("idle");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const filename = useMemo(() => `${safeFilename(packingListNumber)}.pdf`, [packingListNumber]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function loadPdf(action: Exclude<ActionState, "idle">) {
    setBusy(action);
    setError("");
    try {
      const pdfPath = `/api/packing-lists/${packingListId}/pdf?t=${Date.now()}`;
      const response = await fetch(pdfPath, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        const body = contentType.includes("application/json")
          ? await response.json().catch(() => null)
          : await response.text().catch(() => "");
        const serverMessage = typeof body === "object" && body?.error ? body.error : typeof body === "string" && body.trim() ? body.trim() : "";
        throw new Error(serverMessage || `PDF request failed with status ${response.status}. Please refresh and try again.`);
      }
      return await response.blob();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "PDF generation failed. Please refresh and try again.");
      return null;
    } finally {
      setBusy("idle");
    }
  }

  async function previewPdf() {
    const blob = await loadPdf("preview");
    if (!blob) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
  }

  async function downloadPdf() {
    const blob = await loadPdf("download");
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function printPdf() {
    const blob = await loadPdf("print");
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.src = url;
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        setError("Could not open the print dialog. Please use Preview and print from your browser.");
      } finally {
        window.setTimeout(() => {
          frame.remove();
          URL.revokeObjectURL(url);
        }, 3000);
      }
    };
    document.body.append(frame);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={previewPdf} disabled={busy !== "idle"}>
          <Eye className="h-4 w-4" />{busy === "preview" ? "Loading..." : "Preview"}
        </Button>
        <Button type="button" variant="outline" onClick={printPdf} disabled={busy !== "idle"}>
          <Printer className="h-4 w-4" />{busy === "print" ? "Preparing..." : "Print"}
        </Button>
        <Button type="button" onClick={downloadPdf} disabled={busy !== "idle"}>
          <Download className="h-4 w-4" />{busy === "download" ? "Downloading..." : "Download PDF"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => window.open(`/api/packing-lists/${packingListId}/pdf?t=${Date.now()}`, "_blank", "noopener,noreferrer")}>
          Open PDF
        </Button>
      </div>

      {error ? <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      {previewUrl ? (
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>PDF preview</CardTitle>
              <CardDescription>Review the packing list before printing or downloading.</CardDescription>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl("");
            }}>
              <X className="h-4 w-4" />Close preview
            </Button>
          </CardHeader>
          <CardContent>
            <iframe title={`${packingListNumber} PDF preview`} src={previewUrl} className="h-[75vh] w-full rounded-md border bg-background" />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function safeFilename(value: string) {
  return value.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
}
