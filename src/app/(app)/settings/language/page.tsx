import { SettingsPanel } from "@/components/communications/settings-panel";
import { getSettingsData } from "@/lib/communications/service";
import { getTenantContext } from "@/lib/tenant";

export default async function LanguageSettingsPage() {
  return <SettingsPanel active="language" settings={await getSettingsData()} tenant={await getTenantContext()} />;
}
