import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { isBlockedFileType, generateShortId } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  filename: z.string().min(1),
  mimeType: z.string(),
  size: z.number().positive(),
  totalChunks: z.number().positive(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    const { filename, mimeType, size, totalChunks } = body;

    if (isBlockedFileType(filename, mimeType)) {
      return NextResponse.json(
        { error: "File type not allowed (no video, audio, or images)" },
        { status: 400 }
      );
    }

    const maxFileSizeStr = await getSetting("maxFileSize");
    const maxFileSize = Number(maxFileSizeStr) || 500 * 1024 * 1024;
    if (size > maxFileSize) {
      return NextResponse.json(
        { error: `File too large. Maximum allowed is ${Math.round(maxFileSize / (1024 * 1024))} MB` },
        { status: 400 }
      );
    }

    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const storageKey = `uploads/${session.user.id}/${generateShortId(16)}.${ext}`;

    // Create multipart upload on S3
    let multipartUploadId: string | undefined;
    try {
      const { S3Client, CreateMultipartUploadCommand } = await import("@aws-sdk/client-s3");
      const s3 = new S3Client({
        region: process.env.S3_REGION ?? "auto",
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
      });
      const res = await s3.send(
        new CreateMultipartUploadCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: storageKey,
          ContentType: mimeType,
        })
      );
      multipartUploadId = res.UploadId;
    } catch (_) {
      // S3 not configured - session only mode
    }

    const uploadSession = await prisma.uploadSession.create({
      data: {
        userId: session.user.id,
        filename,
        mimeType,
        totalSize: BigInt(size),
        totalChunks,
        storageKey,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({
      sessionId: uploadSession.id,
      storageKey,
      multipartUploadId,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
