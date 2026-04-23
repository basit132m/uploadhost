import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { generateShortId } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  sessionId: z.string(),
  storageKey: z.string(),
  multipartUploadId: z.string().optional().nullable(),
  etags: z.array(z.object({
    PartNumber: z.number(),
    ETag: z.string(),
  })),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    const { sessionId, storageKey, multipartUploadId, etags } = body;

    const uploadSession = await prisma.uploadSession.findUnique({
      where: { id: sessionId, userId: session.user.id },
    });
    if (!uploadSession) {
      return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
    }

    // Complete multipart upload on S3
    if (multipartUploadId && process.env.S3_ENDPOINT && etags.length > 0) {
      try {
        const { S3Client, CompleteMultipartUploadCommand } = await import("@aws-sdk/client-s3");
        const s3 = new S3Client({
          region: process.env.S3_REGION ?? "auto",
          endpoint: process.env.S3_ENDPOINT,
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
          },
        });
        await s3.send(
          new CompleteMultipartUploadCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: storageKey,
            UploadId: multipartUploadId,
            MultipartUpload: {
              Parts: etags.sort((a, b) => a.PartNumber - b.PartNumber),
            },
          })
        );
      } catch (err) {
        console.error("S3 complete error:", err);
      }
    }

    const ext = uploadSession.filename.split(".").pop()?.toLowerCase() ?? "";
    const expiryDays = Number(await getSetting("fileExpiry")) || 0;
    const maxDownloads = Number(await getSetting("maxDownloads")) || null;

    let shortId: string;
    do {
      shortId = generateShortId(8);
    } while (await prisma.file.findUnique({ where: { shortId } }));

    const file = await prisma.file.create({
      data: {
        userId: session.user.id,
        shortId,
        originalName: uploadSession.filename,
        storageKey: uploadSession.storageKey,
        mimeType: uploadSession.mimeType,
        extension: ext,
        size: uploadSession.totalSize,
        maxDownloads: maxDownloads && maxDownloads > 0 ? maxDownloads : null,
        expiresAt: expiryDays > 0 ? new Date(Date.now() + expiryDays * 86400000) : null,
      },
    });

    // Create default direct share
    const { generateToken } = await import("@/lib/utils");
    await prisma.fileShare.create({
      data: {
        fileId: file.id,
        shareType: "DIRECT",
        token: generateToken(32),
      },
    });

    await prisma.uploadSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        storageUsed: { increment: uploadSession.totalSize },
        totalUploads: { increment: 1 },
      },
    });

    return NextResponse.json({ fileId: file.id, shortId: file.shortId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("Complete upload error:", err);
    return NextResponse.json({ error: "Failed to complete upload" }, { status: 500 });
  }
}
