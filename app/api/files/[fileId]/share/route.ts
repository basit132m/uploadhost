import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { generateToken } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  shareType: z.enum(["DIRECT", "ONE_TIME", "TIME_EXPIRY", "PASSWORD"]),
  password: z.string().optional(),
  expiryHours: z.number().optional(),
  maxDownloads: z.number().optional(),
  redirectUrl: z.string().url().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = await prisma.file.findUnique({ where: { id: params.fileId, userId: session.user.id } });
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const body = schema.parse(await request.json());

  // Check admin settings for allowed share types
  const settingKey = `allowedShare_${body.shareType.toLowerCase().replace("_", "")}`;
  const allowed = await getSetting(settingKey);
  if (allowed === "false") {
    return NextResponse.json({ error: "This share type is not enabled" }, { status: 400 });
  }

  let passwordHash: string | undefined;
  if (body.shareType === "PASSWORD" && body.password) {
    passwordHash = await bcrypt.hash(body.password, 10);
  }

  const share = await prisma.fileShare.create({
    data: {
      fileId: params.fileId,
      shareType: body.shareType,
      token: generateToken(32),
      password: passwordHash,
      expiresAt: body.expiryHours
        ? new Date(Date.now() + body.expiryHours * 3600000)
        : null,
      maxDownloads: body.maxDownloads ?? null,
      redirectUrl: body.redirectUrl ?? null,
    },
  });

  return NextResponse.json({ token: share.token, shareId: share.id });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shares = await prisma.fileShare.findMany({
    where: { fileId: params.fileId, file: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(shares);
}
