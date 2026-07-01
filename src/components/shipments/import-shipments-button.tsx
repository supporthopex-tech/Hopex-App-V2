"use client";

import { FileUp } from "lucide-react";
import { useRef } from "react";

export function ImportShipmentsButton() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action="/api/shipments/import" method="post" encType="multipart/form-data">
      <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
        <FileUp className="h-4 w-4" />
        Import
        <input
          className="sr-only"
          type="file"
          name="file"
          accept=".csv"
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
    </form>
  );
}
