import { MessageSquareText } from "lucide-react";
import { CustomerMessageForm } from "@/components/public/customer-message-form";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const querySlug = Array.isArray(query.companySlug) ? query.companySlug[0] : query.companySlug;
  const companySlug = querySlug || process.env.NEXT_PUBLIC_COMPANY_SLUG || process.env.COMPANY_SLUG || process.env.APP_COMPANY_ID || "";

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <section className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageSquareText className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Customer messages</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Send your message to our cargo team</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Fill this secure form and your message will be saved directly in Supabase for the correct company.
            </p>
          </div>
          {!companySlug ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Missing company identifier. Set NEXT_PUBLIC_COMPANY_SLUG, COMPANY_SLUG, APP_COMPANY_ID, or open this page with ?companySlug=your-company.
            </p>
          ) : null}
        </section>
        <CustomerMessageForm companySlug={companySlug} />
      </div>
    </main>
  );
}
