import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminLogsPage({
  searchParams,
}: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const limit = 50;

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.adminLog.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Action Logs</h1>
        <p className="text-muted-foreground">{total} total entries</p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="p-3 text-left">Admin</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left hidden md:table-cell">Details</th>
              <th className="p-3 text-left hidden sm:table-cell">IP</th>
              <th className="p-3 text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No logs yet</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-muted/20">
                  <td className="p-3 font-medium">{log.adminName}</td>
                  <td className="p-3">{log.action}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                    {log.details}
                  </td>
                  <td className="p-3 hidden sm:table-cell text-muted-foreground font-mono text-xs">{log.ip}</td>
                  <td className="p-3 text-muted-foreground text-xs">{formatDateTime(log.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
