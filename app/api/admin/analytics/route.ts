import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subDays, format } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const thirtyDaysAgo = subDays(new Date(), 30);

  const [recentUsers, recentFiles, topCountries] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.file.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    Promise.resolve([]),
  ]);

  const usersByDay: Record<string, number> = {};
  const uploadsByDay: Record<string, number> = {};

  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(new Date(), i), "MMM d");
    usersByDay[date] = 0;
    uploadsByDay[date] = 0;
  }

  for (const u of recentUsers) {
    const date = format(u.createdAt, "MMM d");
    if (date in usersByDay) usersByDay[date]++;
  }

  for (const f of recentFiles) {
    const date = format(f.createdAt, "MMM d");
    if (date in uploadsByDay) uploadsByDay[date]++;
  }

  return NextResponse.json({
    newUsersOverTime: Object.entries(usersByDay).map(([date, count]) => ({ date, count })),
    uploadsOverTime: Object.entries(uploadsByDay).map(([date, count]) => ({ date, count })),
    topCountries,
  });
}
