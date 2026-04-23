import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/storage";
import { z } from "zod";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const file = await prisma.file.findUnique({ where: { id: params.fileId, userId: session.user.id } });
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const updates: any = {};
  if (body.name !== undefined) updates.originalName = body.name;
  if (body.folderId !== undefined) updates.folderId = body.folderId || null;
  if (body.tags !== undefined) updates.tags = body.tags;

  const updated = await prisma.file.update({
    where: { id: params.fileId },
    data: updates,
  });

  return NextResponse.json({ ...updated, size: updated.size.toString() });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = await prisma.file.findUnique({ where: { id: params.fileId, userId: session.user.id } });
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  try {
    await deleteObject(file.storageKey);
  } catch (_) {}

  await prisma.file.delete({ where: { id: params.fileId } });
  await prisma.user.update({
    where: { id: session.user.id },
    data: { storageUsed: { decrement: file.size } },
  });

  return NextResponse.json({ success: true });
}
