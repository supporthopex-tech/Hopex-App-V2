import { SettingsPanel } from "@/components/communications/settings-panel";
import { getSettingsData } from "@/lib/communications/service";
import { getTenantContext } from "@/lib/tenant";

export default async function InviteUsersSettingsPage() {
  return <SettingsPanel active="invite-users" settings={await getSettingsData()} tenant={await getTenantContext()} />;
}
