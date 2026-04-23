import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { sendWelcomeEmail, sendPendingApprovalEmail } from "@/lib/email";
import { generateShortId } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = schema.parse(body);

    const settings = await getSettings();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const isAutoApproval = settings.registrationApproval !== "manual";
    const status = isAutoApproval ? "ACTIVE" : "PENDING";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        status,
        apiKey: generateShortId(32),
      },
    });

    try {
      if (isAutoApproval) {
        await sendWelcomeEmail(email, name);
      } else {
        await sendPendingApprovalEmail(email);
      }
    } catch (_) {
      // Email sending is non-critical
    }

    return NextResponse.json({
      success: true,
      pending: !isAutoApproval,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
