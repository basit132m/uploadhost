import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setSettings, getSettings } from "@/lib/settings";
import { logAdminAction } from "@/lib/admin-log";
import { getClientIp } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates = await request.json();
  await setSettings(updates);

  await logAdminAction(
    session.user.id,
    session.user.name ?? session.user.email!,
    "Updated settings",
    Object.keys(updates).join(", "),
    getClientIp(request)
  );

  return NextResponse.json({ success: true });
}
