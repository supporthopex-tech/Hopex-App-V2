import { SettingsPanel } from "@/components/communications/settings-panel";
import { getSettingsData } from "@/lib/communications/service";
import { getTenantContext } from "@/lib/tenant";

export default async function AppearanceSettingsPage() {
  return <SettingsPanel active="appearance" settings={await getSettingsData()} tenant={await getTenantContext()} />;
}
