import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getObjectStream } from "@/lib/storage";
import bcrypt from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const body = await request.json();
    const { shareToken, password } = body;

    const file = await prisma.file.findUnique({
      where: { id: params.fileId },
      include: { shares: true },
    });

    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

    if (file.expiresAt && file.expiresAt < new Date()) {
      return NextResponse.json({ error: "File has expired" }, { status: 410 });
    }

    if (file.maxDownloads && file.downloadCount >= file.maxDownloads) {
      return NextResponse.json({ error: "Download limit reached" }, { status: 410 });
    }

    // Validate share if token provided
    if (shareToken) {
      const share = await prisma.fileShare.findUnique({
        where: { token: shareToken, fileId: file.id },
      });

      if (!share) return NextResponse.json({ error: "Invalid share link" }, { status: 403 });

      if (share.expiresAt && share.expiresAt < new Date()) {
        return NextResponse.json({ error: "Share link expired" }, { status: 410 });
      }

      if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
        return NextResponse.json({ error: "Share download limit reached" }, { status: 410 });
      }

      if (share.shareType === "PASSWORD") {
        if (!password) return NextResponse.json({ error: "Password required" }, { status: 403 });
        const valid = await bcrypt.compare(password, share.password!);
        if (!valid) return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
      }

      await prisma.fileShare.update({
        where: { id: share.id },
        data: { downloadCount: { increment: 1 } },
      });

      // Delete one-time shares after use
      if (share.shareType === "ONE_TIME") {
        await prisma.fileShare.delete({ where: { id: share.id } });
      }
    }

    // Increment file download count
    await prisma.file.update({
      where: { id: file.id },
      data: { downloadCount: { increment: 1 } },
    });

    await prisma.user.update({
      where: { id: file.userId },
      data: { totalDownloads: { increment: 1 } },
    });

    // Stream file from storage
    try {
      const stream = await getObjectStream(file.storageKey);
      if (!stream) throw new Error("No stream");

      return new NextResponse(stream as any, {
        headers: {
          "Content-Type": file.mimeType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
    }
  } catch (err) {
    console.error("Download error:", err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
