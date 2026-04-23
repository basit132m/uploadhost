import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  reason: z.string().min(5).max(500),
  details: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required to report" }, { status: 401 });
  }

  const body = schema.parse(await request.json());
  const file = await prisma.file.findUnique({ where: { id: params.fileId } });
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  // Prevent self-reporting
  if (file.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot report your own file" }, { status: 400 });
  }

  const existing = await prisma.report.findFirst({
    where: { fileId: params.fileId, reporterId: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Already reported" }, { status: 400 });
  }

  await prisma.report.create({
    data: {
      fileId: params.fileId,
      reporterId: session.user.id,
      reason: body.reason,
      details: body.details,
    },
  });

  return NextResponse.json({ success: true });
}
