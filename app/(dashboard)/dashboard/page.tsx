import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatBytes, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadZone } from "@/components/upload/upload-zone";
import { getSettings } from "@/lib/settings";
import { DashboardCharts } from "@/components/dashboard/charts";
import { Files, HardDrive, Download, Upload } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const settings = await getSettings();
  const userId = session.user.id;

  const [user, recentFiles, totalStats] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.file.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { shares: { take: 1 } },
    }),
    prisma.file.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { downloadCount: true, size: true },
    }),
  ]);

  const stats = [
    {
      title: "Total Files",
      value: totalStats._count.id ?? 0,
      icon: Files,
      suffix: "files",
    },
    {
      title: "Storage Used",
      value: formatBytes(Number(totalStats._sum.size ?? 0)),
      icon: HardDrive,
      suffix: "",
    },
    {
      title: "Total Downloads",
      value: totalStats._sum.downloadCount ?? 0,
      icon: Download,
      suffix: "downloads",
    },
    {
      title: "Uploads This Month",
      value: user?.totalUploads ?? 0,
      icon: Upload,
      suffix: "total",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name ?? session.user.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadZone maxFileSize={Number(settings.maxFileSize)} compact />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Files</CardTitle>
            <Link href="/files" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No files yet. Upload your first file!
              </p>
            ) : (
              <div className="space-y-3">
                {recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.originalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(Number(file.size))} · {formatDate(file.createdAt)}
                      </p>
                    </div>
                    <Link
                      href={`/f/${file.shortId}`}
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      Share
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DashboardCharts userId={userId} />
    </div>
  );
}
