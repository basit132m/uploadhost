import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  token: z.string(),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const { token, password } = schema.parse(await request.json());

    const reset = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!reset || reset.expires < new Date()) {
      return NextResponse.json({ error: "Token invalid or expired" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email: reset.email },
      data: { passwordHash },
    });
    await prisma.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
