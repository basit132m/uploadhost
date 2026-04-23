import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-log";
import { getClientIp } from "@/lib/utils";
import { sendAccountApprovedEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "BANNED"]).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  apiEnabled: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.parse(await request.json());
  const targetUser = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id: params.userId },
    data: body,
  });

  await logAdminAction(
    session.user.id,
    session.user.name ?? session.user.email!,
    `Updated user ${targetUser.email}`,
    JSON.stringify(body),
    getClientIp(request)
  );

  // Send approval email
  if (body.status === "ACTIVE" && targetUser.status === "PENDING") {
    try {
      await sendAccountApprovedEmail(targetUser.email, targetUser.name ?? "");
    } catch (_) {}
  }

  return NextResponse.json(updated);
}
