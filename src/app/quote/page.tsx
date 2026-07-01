import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicQuoteRequestForm } from "@/components/public/quote-request-form";
import { Button } from "@/components/ui/button";

export default function PublicQuotePage() {
  return (
    <main className="min-h-screen bg-muted/40 p-4 py-10">
      <div className="mx-auto max-w-3xl space-y-4">
        <Button asChild variant="ghost" className="px-0">
          <Link href="/"><ArrowLeft className="h-4 w-4" /> Back to tracking</Link>
        </Button>
        <PublicQuoteRequestForm />
      </div>
    </main>
  );
}
