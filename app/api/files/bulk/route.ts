import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/storage";
import archiver from "archiver";
import { getObjectStream } from "@/lib/storage";
import { z } from "zod";

const schema = z.object({
  fileIds: z.array(z.string()).min(1).max(100),
  action: z.enum(["delete", "move", "tag", "download-zip"]),
  folderId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.parse(await request.json());
  const { fileIds, action, folderId, tags } = body;

  const files = await prisma.file.findMany({
    where: { id: { in: fileIds }, userId: session.user.id },
  });
  if (files.length === 0) return NextResponse.json({ error: "No files found" }, { status: 404 });

  switch (action) {
    case "delete": {
      for (const file of files) {
        try { await deleteObject(file.storageKey); } catch (_) {}
      }
      await prisma.file.deleteMany({ where: { id: { in: files.map((f) => f.id) } } });
      const totalSize = files.reduce((sum, f) => sum + BigInt(f.size), 0n);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { storageUsed: { decrement: totalSize } },
      });
      return NextResponse.json({ success: true, count: files.length });
    }

    case "move": {
      await prisma.file.updateMany({
        where: { id: { in: files.map((f) => f.id) } },
        data: { folderId: folderId ?? null },
      });
      return NextResponse.json({ success: true, count: files.length });
    }

    case "tag": {
      for (const file of files) {
        await prisma.file.update({
          where: { id: file.id },
          data: { tags: tags ?? [] },
        });
      }
      return NextResponse.json({ success: true, count: files.length });
    }

    case "download-zip": {
      return NextResponse.json({ success: true, message: "Use /api/files/zip endpoint" });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
