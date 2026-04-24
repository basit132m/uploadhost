import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const pages = await prisma.customPage.findMany({ where: { published: true } });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://uploadhost.site";

  const urls = [
    `<url><loc>${baseUrl}</loc><priority>1.0</priority></url>`,
    `<url><loc>${baseUrl}/login</loc><priority>0.8</priority></url>`,
    `<url><loc>${baseUrl}/register</loc><priority>0.8</priority></url>`,
    ...pages.map((p) => `<url><loc>${baseUrl}/p/${p.slug}</loc><priority>0.6</priority></url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
