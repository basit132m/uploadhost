import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { DashboardSidebar } from "@/components/layout/sidebar";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const settings = await getSettings();
  const pages = await prisma.customPage.findMany({
    where: { published: true },
    select: { slug: true, title: true },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar siteName={settings.siteName} siteLogo={settings.siteLogo || undefined} />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
