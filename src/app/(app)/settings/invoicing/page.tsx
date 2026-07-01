import { SettingsPanel } from "@/components/communications/settings-panel";
import { getSettingsData } from "@/lib/communications/service";
import { getTenantContext } from "@/lib/tenant";

export default async function InvoicingSettingsPage() {
  return <SettingsPanel active="invoicing" settings={await getSettingsData()} tenant={await getTenantContext()} />;
}
