import { SettingsPanel } from "@/components/communications/settings-panel";
import { getSettingsData } from "@/lib/communications/service";
import { getTenantContext } from "@/lib/tenant";

export default async function NotificationSettingsPage() {
  return <SettingsPanel active="notifications" settings={await getSettingsData()} tenant={await getTenantContext()} />;
}
