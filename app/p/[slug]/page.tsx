import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: { params: { slug: string } }): Promise<Metadata> {
  const page = await prisma.customPage.findUnique({ where: { slug: params.slug } });
  if (!page) return {};
  return {
    title: page.metaTitle ?? page.title,
    description: page.metaDesc ?? undefined,
  };
}

export default async function CustomPageView({ params }: { params: { slug: string } }) {
  const [page, settings, pages] = await Promise.all([
    prisma.customPage.findUnique({ where: { slug: params.slug, published: true } }),
    getSettings(),
    prisma.customPage.findMany({ where: { published: true }, select: { slug: true, title: true } }),
  ]);

  if (!page) notFound();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar siteName={settings.siteName} siteLogo={settings.siteLogo || undefined} />
      <main className="flex-1 container py-12 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </main>
      <Footer siteName={settings.siteName} pages={pages} />
    </div>
  );
}
