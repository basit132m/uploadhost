import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function getApiUser(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (!apiKey) return null;
  return prisma.user.findFirst({
    where: { apiKey, apiEnabled: true, status: "ACTIVE" },
  });
}

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  const files = await prisma.file.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, shortId: true, originalName: true, extension: true,
      size: true, downloadCount: true, createdAt: true, expiresAt: true,
    },
  });

  return NextResponse.json({
    files: files.map((f) => ({
      ...f,
      size: Number(f.size),
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/f/${f.shortId}`,
    })),
  });
}
