import { prisma } from "@/lib/db";
import { AdminAdsClient } from "@/components/admin/admin-ads";
import { getSettings } from "@/lib/settings";

export default async function AdminAdsPage() {
  const settings = await getSettings();
  const slots = await prisma.adSlot.findMany({ orderBy: { page: "asc" } });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Ad Management</h1>
        <p className="text-muted-foreground">Paste ad network codes into page slots</p>
      </div>
      <AdminAdsClient
        slots={slots}
        bannerSettings={{
          homepage: settings.adBanner_homepage ?? "",
          download: settings.adBanner_download ?? "",
          dashboard: settings.adBanner_dashboard ?? "",
        }}
      />
    </div>
  );
}
