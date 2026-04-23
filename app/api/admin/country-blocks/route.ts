import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  countryCode: z.string().length(2),
  countryName: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = schema.parse(await request.json());
  const block = await prisma.countryBlock.upsert({
    where: { countryCode: body.countryCode },
    create: body,
    update: { countryName: body.countryName },
  });
  return NextResponse.json(block, { status: 201 });
}
