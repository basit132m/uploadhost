import { prisma } from "@/lib/db";
import { formatBytes, formatDate } from "@/lib/utils";
import { AdminFilesClient } from "@/components/admin/admin-files";

export default async function AdminFilesPage({
  searchParams,
}: { searchParams: { page?: string; search?: string } }) {
  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const search = searchParams.search ?? "";
  const limit = 20;

  const where: any = {};
  if (search) where.originalName = { contains: search, mode: "insensitive" };

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.file.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">File Management</h1>
        <p className="text-muted-foreground">{total} total files</p>
      </div>
      <AdminFilesClient
        files={files.map((f) => ({ ...f, size: f.size.toString() }))}
        total={total}
        page={page}
        pages={Math.ceil(total / limit)}
      />
    </div>
  );
}
