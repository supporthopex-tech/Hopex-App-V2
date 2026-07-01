import { EmailCompose } from "@/components/communications/email-compose";
import { getEmailComposeData } from "@/lib/communications/service";

export default async function EmailComposePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [params, composeData] = await Promise.all([searchParams, getEmailComposeData()]);
  return (
    <EmailCompose
      composeData={composeData}
      defaults={{
        to: params.to,
        templateKey: params.template,
        relatedCustomerId: params.customerId,
        relatedShipmentId: params.shipmentId,
        relatedQuoteId: params.quoteId,
        subject: params.subject,
      }}
    />
  );
}
