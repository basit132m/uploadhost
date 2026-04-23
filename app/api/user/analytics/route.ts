import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subDays, format } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const thirtyDaysAgo = subDays(new Date(), 30);

  const [recentFiles, topFiles] = await Promise.all([
    prisma.file.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.file.findMany({
      where: { userId },
      orderBy: { downloadCount: "desc" },
      take: 5,
      select: { originalName: true, downloadCount: true },
    }),
  ]);

  // Build daily upload counts
  const uploadsByDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(new Date(), i), "MMM d");
    uploadsByDay[date] = 0;
  }
  for (const file of recentFiles) {
    const date = format(file.createdAt, "MMM d");
    if (date in uploadsByDay) uploadsByDay[date]++;
  }

  return NextResponse.json({
    uploadsOverTime: Object.entries(uploadsByDay).map(([date, count]) => ({ date, count })),
    downloadsOverTime: [],
    topFiles: topFiles.map((f) => ({
      name: f.originalName.length > 12 ? f.originalName.slice(0, 12) + "…" : f.originalName,
      downloads: f.downloadCount,
    })),
  });
}
