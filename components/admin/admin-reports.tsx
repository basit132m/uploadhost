"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Report {
  id: string;
  reason: string;
  status: string;
  createdAt: Date;
  file: { originalName: string; shortId: string };
  reporter: { email: string; name: string | null };
}

export function AdminReportsClient({ reports: initialReports }: { reports: Report[] }) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);

  async function updateReport(id: string, status: string) {
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      toast.success("Report updated");
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    REVIEWED: "bg-blue-100 text-blue-700",
    RESOLVED: "bg-green-100 text-green-700",
    DISMISSED: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="p-3 text-left">File</th>
            <th className="p-3 text-left">Reporter</th>
            <th className="p-3 text-left">Reason</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.length === 0 ? (
            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No reports</td></tr>
          ) : (
            reports.map((report) => (
              <tr key={report.id} className="border-b hover:bg-muted/20">
                <td className="p-3">
                  <a href={`/f/${report.file.shortId}`} target="_blank" className="text-primary hover:underline">
                    {report.file.originalName}
                  </a>
                </td>
                <td className="p-3 text-muted-foreground">{report.reporter.name ?? report.reporter.email}</td>
                <td className="p-3 max-w-[200px] truncate">{report.reason}</td>
                <td className="p-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[report.status] ?? ""}`}>
                    {report.status}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{formatDate(report.createdAt)}</td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    {report.status === "PENDING" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateReport(report.id, "REVIEWED")}>
                          Review
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateReport(report.id, "DISMISSED")}>
                          Dismiss
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateReport(report.id, "RESOLVED")}>
                          Resolve
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
