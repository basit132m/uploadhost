import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const ext = searchParams.get("ext") ?? "";
  const folderId = searchParams.get("folderId") ?? undefined;
  const sort = searchParams.get("sort") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = 20;

  const where: any = { userId: session.user.id };
  if (search) where.originalName = { contains: search, mode: "insensitive" };
  if (tag) where.tags = { contains: `"${tag}"` };
  if (ext) where.extension = ext;
  if (folderId !== undefined) where.folderId = folderId || null;

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where,
      orderBy: { [sort]: order },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        shares: { select: { id: true, shareType: true, token: true, expiresAt: true } },
        folder: { select: { id: true, name: true } },
      },
    }),
    prisma.file.count({ where }),
  ]);

  return NextResponse.json({
    files: files.map((f) => ({
      ...f,
      size: f.size.toString(),
      tags: (() => { try { return JSON.parse(f.tags); } catch { return []; } })(),
    })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}
