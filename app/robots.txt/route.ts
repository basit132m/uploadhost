import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

export async function GET() {
  const robotsTxt = await getSetting("robotsTxt");
  return new NextResponse(robotsTxt, {
    headers: { "Content-Type": "text/plain" },
  });
}
