import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminReportsClient } from "@/components/admin/admin-reports";

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      file: { select: { originalName: true, shortId: true } },
      reporter: { select: { email: true, name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abuse Reports</h1>
        <p className="text-muted-foreground">{reports.filter((r) => r.status === "PENDING").length} pending reports</p>
      </div>
      <AdminReportsClient reports={reports} />
    </div>
  );
}
