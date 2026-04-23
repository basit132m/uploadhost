import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const folder = await prisma.folder.findUnique({
    where: { id: params.folderId, userId: session.user.id },
  });
  if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 });

  const updated = await prisma.folder.update({
    where: { id: params.folderId },
    data: { name: body.name, parentId: body.parentId ?? folder.parentId },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folder = await prisma.folder.findUnique({
    where: { id: params.folderId, userId: session.user.id },
  });
  if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 });

  // Move files to root before deletion
  await prisma.file.updateMany({
    where: { folderId: params.folderId },
    data: { folderId: null },
  });

  await prisma.folder.delete({ where: { id: params.folderId } });
  return NextResponse.json({ success: true });
}
