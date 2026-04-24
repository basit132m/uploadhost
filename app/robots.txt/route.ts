import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const robotsTxt = await getSetting("robotsTxt");
  return new NextResponse(robotsTxt, {
    headers: { "Content-Type": "text/plain" },
  });
}
