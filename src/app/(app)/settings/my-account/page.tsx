import { SettingsPanel } from "@/components/communications/settings-panel";
import { getSettingsData } from "@/lib/communications/service";
import { getTenantContext } from "@/lib/tenant";

export default async function MyAccountSettingsPage() {
  return <SettingsPanel active="my-account" settings={await getSettingsData()} tenant={await getTenantContext()} />;
}
