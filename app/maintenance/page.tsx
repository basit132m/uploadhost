import { getSettings } from "@/lib/settings";

export default async function MaintenancePage() {
  const settings = await getSettings();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔧</div>
        <h1 className="text-3xl font-bold mb-4">{settings.siteName} is under maintenance</h1>
        <p className="text-muted-foreground text-lg">{settings.maintenanceMessage}</p>
        <p className="text-sm text-muted-foreground mt-6">Please check back soon.</p>
      </div>
    </div>
  );
}
