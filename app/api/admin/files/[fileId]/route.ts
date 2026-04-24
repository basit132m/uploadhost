import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/storage";
import { logAdminAction } from "@/lib/admin-log";
import { getClientIp } from "@/lib/utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const file = await prisma.file.findUnique({ where: { id: params.fileId } });
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  try { await deleteObject(file.storageKey); } catch (_) {}

  await prisma.file.delete({ where: { id: params.fileId } });
  await prisma.user.update({
    where: { id: file.userId },
    data: { storageUsed: { decrement: file.size } },
  });

  await logAdminAction(
    session.user.id!,
    session.user.name ?? session.user.email!,
    `Deleted file ${file.originalName}`,
    file.id,
    getClientIp(request)
  );

  return NextResponse.json({ success: true });
}
