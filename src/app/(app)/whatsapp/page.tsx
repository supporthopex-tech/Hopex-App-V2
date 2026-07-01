import { WhatsAppModule } from "@/components/communications/whatsapp-module";
import { getWhatsAppData } from "@/lib/communications/service";

export default async function WhatsAppPage() {
  return <WhatsAppModule {...await getWhatsAppData()} tab="manual" />;
}
