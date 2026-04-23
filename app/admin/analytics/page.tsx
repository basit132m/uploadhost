import { prisma } from "@/lib/db";
import { formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminCharts } from "@/components/admin/admin-charts";
import { AdminCountryBlocker } from "@/components/admin/admin-country-blocker";

export default async function AdminAnalyticsPage() {
  const [
    userCount, fileCount, fileSizes, downloadSum,
    activeUsers, bannedUsers, pendingUsers, countryBlocks,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.file.count(),
    prisma.file.aggregate({ _sum: { size: true } }),
    prisma.file.aggregate({ _sum: { downloadCount: true } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "BANNED" } }),
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.countryBlock.findMany({ orderBy: { countryCode: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics & Statistics</h1>
        <p className="text-muted-foreground">Platform-wide metrics and charts</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Users", value: activeUsers },
          { label: "Pending Users", value: pendingUsers },
          { label: "Banned Users", value: bannedUsers },
          { label: "Total Files", value: fileCount },
          { label: "Total Storage", value: formatBytes(Number(fileSizes._sum.size ?? 0)) },
          { label: "Total Downloads", value: downloadSum._sum.downloadCount ?? 0 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminCharts />

      <AdminCountryBlocker initialBlocks={countryBlocks} />
    </div>
  );
}
