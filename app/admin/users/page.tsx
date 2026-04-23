import { prisma } from "@/lib/db";
import { AdminUsersClient } from "@/components/admin/admin-users";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; status?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const search = searchParams.search ?? "";
  const status = searchParams.status ?? "";
  const limit = 20;

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true, name: true, email: true, role: true, status: true,
        storageUsed: true, totalUploads: true, apiEnabled: true, createdAt: true,
        _count: { select: { files: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">{total} total users</p>
      </div>
      <AdminUsersClient
        users={users.map((u) => ({ ...u, storageUsed: u.storageUsed.toString() }))}
        total={total}
        page={page}
        pages={Math.ceil(total / limit)}
      />
    </div>
  );
}
