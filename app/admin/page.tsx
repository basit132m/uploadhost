import { prisma } from "@/lib/db";
import { formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Files, HardDrive, Download, AlertTriangle, Activity } from "lucide-react";
import { AdminCharts } from "@/components/admin/admin-charts";

export default async function AdminDashboard() {
  const [userCount, fileCount, fileSizes, downloadSum, reportCount, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.file.count(),
    prisma.file.aggregate({ _sum: { size: true } }),
    prisma.file.aggregate({ _sum: { downloadCount: true } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true, status: true },
    }),
  ]);

  const stats = [
    { title: "Total Users", value: userCount, icon: Users, color: "text-blue-500" },
    { title: "Total Files", value: fileCount, icon: Files, color: "text-green-500" },
    { title: "Storage Used", value: formatBytes(Number(fileSizes._sum.size ?? 0)), icon: HardDrive, color: "text-purple-500" },
    { title: "Total Downloads", value: downloadSum._sum.downloadCount ?? 0, icon: Download, color: "text-orange-500" },
    { title: "Pending Reports", value: reportCount, icon: AlertTriangle, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and statistics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AdminCharts />

      <Card>
        <CardHeader><CardTitle>Recent Users</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="p-2">{u.name ?? "—"}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                      u.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-2 text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
