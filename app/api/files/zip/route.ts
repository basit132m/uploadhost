import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getObjectStream } from "@/lib/storage";
import archiver from "archiver";
import { Readable } from "stream";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileIds } = await request.json();
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return NextResponse.json({ error: "No files specified" }, { status: 400 });
  }

  const files = await prisma.file.findMany({
    where: { id: { in: fileIds }, userId: session.user.id },
  });
  if (files.length === 0) return NextResponse.json({ error: "Files not found" }, { status: 404 });

  const archive = archiver("zip", { zlib: { level: 6 } });
  const chunks: Buffer[] = [];

  archive.on("data", (chunk: Buffer) => chunks.push(chunk));
  await new Promise<void>((resolve, reject) => {
    archive.on("end", resolve);
    archive.on("error", reject);

    (async () => {
      for (const file of files) {
        try {
          const stream = await getObjectStream(file.storageKey);
          if (stream) {
            archive.append(stream as any, { name: file.originalName });
          }
        } catch (_) {}
      }
      archive.finalize();
    })();
  });

  const zipBuffer = Buffer.concat(chunks);
  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="files.zip"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
