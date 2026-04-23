import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { UploadSection } from "@/components/upload/upload-section";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const settings = await getSettings();

  if (settings.maintenanceMode === "true") {
    // Admin bypasses maintenance mode
  }

  const pages = await prisma.customPage.findMany({
    where: { published: true },
    select: { slug: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar siteName={settings.siteName} siteLogo={settings.siteLogo || undefined} />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl mx-auto text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {settings.siteName}
          </h1>
          <p className="text-xl text-muted-foreground">
            {settings.siteTagline}
          </p>
        </div>

        <div className="w-full max-w-2xl mx-auto">
          <UploadSection maxFileSize={Number(settings.maxFileSize)} />
        </div>

        {settings.adBanner_homepage && (
          <div
            className="mt-8 w-full max-w-2xl"
            dangerouslySetInnerHTML={{ __html: settings.adBanner_homepage }}
          />
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full mx-auto text-center">
          {[
            { title: "Lightning Fast", desc: "Chunked + parallel uploads for maximum speed", icon: "⚡" },
            { title: "Resumable", desc: "Pick up where you left off if connection drops", icon: "🔄" },
            { title: "Secure Sharing", desc: "Short links, passwords, expiry controls", icon: "🔒" },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-xl border bg-card">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer siteName={settings.siteName} pages={pages} />
    </div>
  );
}
