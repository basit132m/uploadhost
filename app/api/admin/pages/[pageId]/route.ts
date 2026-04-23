import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  published: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.parse(await request.json());
  const page = await prisma.customPage.update({
    where: { id: params.pageId },
    data: body,
  });
  return NextResponse.json(page);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.customPage.delete({ where: { id: params.pageId } });
  return NextResponse.json({ success: true });
}
