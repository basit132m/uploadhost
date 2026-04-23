import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: "UploadHost",
    label: session.user.email!,
    secret,
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret.base32 },
  });

  const qrCodeUrl = await QRCode.toDataURL(totp.toString());

  return NextResponse.json({
    secret: secret.base32,
    qrCode: qrCodeUrl,
    otpAuthUrl: totp.toString(),
  });
}
