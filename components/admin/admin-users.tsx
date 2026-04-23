"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBytes, formatDate } from "@/lib/utils";
import { Search, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  storageUsed: string;
  totalUploads: number;
  apiEnabled: boolean;
  createdAt: Date;
  _count: { files: number };
}

interface AdminUsersClientProps {
  users: AdminUser[];
  total: number;
  page: number;
  pages: number;
}

export function AdminUsersClient({ users, total, page, pages }: AdminUsersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  function applyFilters() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", "1");
    router.push(`/admin/users?${params}`);
  }

  async function updateUser(userId: string, updates: any) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      toast.success("User updated");
      router.refresh();
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Failed");
    }
  }

  async function deleteUserFiles(userId: string) {
    if (!confirm("Delete ALL files for this user?")) return;
    const res = await fetch(`/api/admin/users/${userId}/files`, { method: "DELETE" });
    if (res.ok) { toast.success("Files deleted"); router.refresh(); }
    else toast.error("Failed");
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    SUSPENDED: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    BANNED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="BANNED">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={applyFilters}>Search</Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="p-3 text-left font-medium">User</th>
              <th className="p-3 text-left font-medium hidden sm:table-cell">Status</th>
              <th className="p-3 text-left font-medium hidden md:table-cell">Files</th>
              <th className="p-3 text-left font-medium hidden lg:table-cell">Storage</th>
              <th className="p-3 text-left font-medium hidden lg:table-cell">Joined</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users found</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/20">
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{user.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {user.role === "ADMIN" && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Admin</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[user.status] ?? ""}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{user._count.files}</td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">
                    {formatBytes(Number(user.storageUsed))}
                  </td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="p-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.status === "PENDING" && (
                          <DropdownMenuItem onClick={() => updateUser(user.id, { status: "ACTIVE" })}>
                            Approve Account
                          </DropdownMenuItem>
                        )}
                        {user.status !== "SUSPENDED" && user.role !== "ADMIN" && (
                          <DropdownMenuItem onClick={() => updateUser(user.id, { status: "SUSPENDED" })}>
                            Suspend (Temporary)
                          </DropdownMenuItem>
                        )}
                        {user.status === "SUSPENDED" && (
                          <DropdownMenuItem onClick={() => updateUser(user.id, { status: "ACTIVE" })}>
                            Unsuspend
                          </DropdownMenuItem>
                        )}
                        {user.status !== "BANNED" && user.role !== "ADMIN" && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => updateUser(user.id, { status: "BANNED" })}
                          >
                            Permanent Ban
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => updateUser(user.id, { apiEnabled: !user.apiEnabled })}
                        >
                          {user.apiEnabled ? "Disable API" : "Enable API"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteUserFiles(user.id)}
                        >
                          Delete All Files
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => router.push(`/admin/users?page=${page - 1}`)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => router.push(`/admin/users?page=${page + 1}`)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
