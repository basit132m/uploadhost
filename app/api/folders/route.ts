import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId") ?? undefined;

  const folders = await prisma.folder.findMany({
    where: { userId: session.user.id, parentId: parentId || null },
    include: { _count: { select: { files: true, children: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(folders);
}

const schema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, parentId } = schema.parse(await request.json());
  const folder = await prisma.folder.create({
    data: { userId: session.user.id, name, parentId: parentId || null },
  });

  return NextResponse.json(folder, { status: 201 });
}
