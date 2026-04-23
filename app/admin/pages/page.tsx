import { prisma } from "@/lib/db";
import { AdminPagesClient } from "@/components/admin/admin-pages";

export default async function AdminPagesPage() {
  const pages = await prisma.customPage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Custom Pages</h1>
        <p className="text-muted-foreground">Create and manage static pages (About, Terms, Privacy, FAQ, etc.)</p>
      </div>
      <AdminPagesClient pages={pages} />
    </div>
  );
}
