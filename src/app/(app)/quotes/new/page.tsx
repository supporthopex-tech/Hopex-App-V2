import { QuoteForm } from "@/components/operations/quote-form";
import { getTenantContext } from "@/lib/tenant";

export default async function NewQuotePage() {
  const tenant = await getTenantContext();
  return <QuoteForm currency={tenant.company.currency} />;
}
