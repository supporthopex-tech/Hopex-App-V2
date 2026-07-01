import { WhatsAppModule } from "@/components/communications/whatsapp-module";
import { getWhatsAppData } from "@/lib/communications/service";

export default async function WhatsAppLogPage() {
  return <WhatsAppModule {...await getWhatsAppData()} tab="log" />;
}
