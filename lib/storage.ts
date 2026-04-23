import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client() {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

const BUCKET = () => process.env.S3_BUCKET_NAME!;

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
}

export async function uploadStream(
  key: string,
  stream: ReadableStream,
  mimeType: string
): Promise<void> {
  const client = getS3Client();
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const body = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: body,
      ContentType: mimeType,
    })
  );
}

export async function appendChunk(
  key: string,
  chunkIndex: number,
  totalChunks: number,
  data: Buffer,
  uploadId?: string
): Promise<{ uploadId?: string; etag?: string }> {
  const client = getS3Client();
  if (!uploadId) {
    const res = await client.send(
      new CreateMultipartUploadCommand({ Bucket: BUCKET(), Key: key })
    );
    uploadId = res.UploadId!;
  }
  const res = await client.send(
    new UploadPartCommand({
      Bucket: BUCKET(),
      Key: key,
      UploadId: uploadId,
      PartNumber: chunkIndex + 1,
      Body: data,
    })
  );
  return { uploadId, etag: res.ETag };
}

export async function completeMultipart(
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[]
): Promise<void> {
  const client = getS3Client();
  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: BUCKET(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })
  );
}

export async function abortMultipart(key: string, uploadId: string): Promise<void> {
  const client = getS3Client();
  await client.send(
    new AbortMultipartUploadCommand({ Bucket: BUCKET(), Key: key, UploadId: uploadId })
  );
}

export async function deleteObject(key: string): Promise<void> {
  const client = getS3Client();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));
}

export async function getObject(key: string): Promise<Buffer> {
  const client = getS3Client();
  const res = await client.send(
    new GetObjectCommand({ Bucket: BUCKET(), Key: key })
  );
  const chunks: Uint8Array[] = [];
  for await (const chunk of res.Body as any) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function getObjectStream(key: string) {
  const client = getS3Client();
  const res = await client.send(
    new GetObjectCommand({ Bucket: BUCKET(), Key: key })
  );
  return res.Body;
}

export async function getPresignedDownloadUrl(
  key: string,
  filename: string,
  expiresIn = 3600
): Promise<string> {
  if (process.env.S3_PUBLIC_URL) {
    return `${process.env.S3_PUBLIC_URL}/${key}`;
  }
  const client = getS3Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    }),
    { expiresIn }
  );
}
