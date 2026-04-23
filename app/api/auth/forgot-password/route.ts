import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateToken } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const { email } = schema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = generateToken(48);
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.deleteMany({ where: { email } });
      await prisma.passwordResetToken.create({ data: { email, token, expires } });

      try {
        await sendPasswordResetEmail(email, token);
      } catch (_) {}
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
