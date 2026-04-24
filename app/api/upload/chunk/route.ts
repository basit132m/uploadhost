import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const chunkIndex = Number(formData.get("chunkIndex"));
    const totalChunks = Number(formData.get("totalChunks"));
    const multipartUploadId = formData.get("multipartUploadId") as string;
    const storageKey = formData.get("storageKey") as string;
    const chunkBlob = formData.get("chunk") as Blob;

    if (!sessionId || !chunkBlob) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const uploadSession = await prisma.uploadSession.findUnique({
      where: { id: sessionId, userId: session.user.id },
    });
    if (!uploadSession) {
      return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
    }

    const chunkBuffer = Buffer.from(await chunkBlob.arrayBuffer());
    let etag = `"chunk-${chunkIndex}"`;

    if (multipartUploadId && process.env.S3_ENDPOINT) {
      try {
        const { S3Client, UploadPartCommand } = await import("@aws-sdk/client-s3");
        const s3 = new S3Client({
          region: process.env.S3_REGION ?? "auto",
          endpoint: process.env.S3_ENDPOINT,
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
          },
        });
        const res = await s3.send(
          new UploadPartCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: storageKey,
            UploadId: multipartUploadId,
            PartNumber: chunkIndex + 1,
            Body: chunkBuffer,
          })
        );
        etag = res.ETag ?? etag;
      } catch (_) {}
    }

    const uploadedSize = Math.min(
      Number(uploadSession.uploadedSize) + chunkBuffer.length,
      Number(uploadSession.totalSize)
    );

    await prisma.uploadSession.update({
      where: { id: sessionId },
      data: {
        chunksReceived: { increment: 1 },
        uploadedSize: BigInt(uploadedSize),
      },
    });

    return NextResponse.json({ etag, chunkIndex });
  } catch (err) {
    console.error("Chunk upload error:", err);
    return NextResponse.json({ error: "Chunk upload failed" }, { status: 500 });
  }
}
