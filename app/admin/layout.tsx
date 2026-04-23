import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { AdminSidebar } from "@/components/layout/sidebar";
import { getSettings } from "@/lib/settings";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/dashboard");

  const settings = await getSettings();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar siteName={settings.siteName} siteLogo={settings.siteLogo || undefined} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
