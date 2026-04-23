import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["REVIEWED", "RESOLVED", "DISMISSED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = schema.parse(await request.json());
  const report = await prisma.report.update({
    where: { id: params.reportId },
    data: { status },
  });
  return NextResponse.json(report);
}
