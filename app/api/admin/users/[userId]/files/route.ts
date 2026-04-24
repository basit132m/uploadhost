import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/storage";
import { logAdminAction } from "@/lib/admin-log";
import { getClientIp } from "@/lib/utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const files = await prisma.file.findMany({ where: { userId: params.userId } });
  for (const file of files) {
    try { await deleteObject(file.storageKey); } catch (_) {}
  }
  await prisma.file.deleteMany({ where: { userId: params.userId } });
  await prisma.user.update({
    where: { id: params.userId },
    data: { storageUsed: 0n, totalUploads: 0 },
  });

  await logAdminAction(
    session.user.id!,
    session.user.name ?? session.user.email!,
    `Deleted all files for user ${params.userId}`,
    `${files.length} files deleted`,
    getClientIp(request)
  );

  return NextResponse.json({ success: true, deleted: files.length });
}
