import { getSettings } from "@/lib/settings";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Global Settings</h1>
        <p className="text-muted-foreground">Configure platform-wide settings</p>
      </div>
      <AdminSettingsForm settings={settings} />
    </div>
  );
}
