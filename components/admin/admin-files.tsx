"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes, formatDate } from "@/lib/utils";
import { Search, Trash2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface AdminFile {
  id: string;
  shortId: string;
  originalName: string;
  size: string;
  downloadCount: number;
  createdAt: Date;
  user: { email: string; name: string | null };
}

export function AdminFilesClient({ files, total, page, pages }: {
  files: AdminFile[];
  total: number;
  page: number;
  pages: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  async function deleteFile(fileId: string) {
    if (!confirm("Delete this file?")) return;
    const res = await fetch(`/api/admin/files/${fileId}`, { method: "DELETE" });
    if (res.ok) { toast.success("File deleted"); router.refresh(); }
    else toast.error("Failed to delete");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const params = new URLSearchParams();
                if (search) params.set("search", search);
                router.push(`/admin/files?${params}`);
              }
            }}
            className="pl-9"
          />
        </div>
        <Button onClick={() => router.push(`/admin/files?search=${search}`)}>Search</Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="p-3 text-left">File</th>
              <th className="p-3 text-left hidden sm:table-cell">Owner</th>
              <th className="p-3 text-left hidden md:table-cell">Size</th>
              <th className="p-3 text-left hidden md:table-cell">Downloads</th>
              <th className="p-3 text-left hidden lg:table-cell">Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No files</td></tr>
            ) : (
              files.map((file) => (
                <tr key={file.id} className="border-b hover:bg-muted/20">
                  <td className="p-3">
                    <p className="font-medium truncate max-w-[180px]">{file.originalName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{file.shortId}</p>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-muted-foreground">
                    {file.user.name ?? file.user.email}
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">
                    {formatBytes(Number(file.size))}
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{file.downloadCount}</td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">{formatDate(file.createdAt)}</td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <a href={`/f/${file.shortId}`} target="_blank">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => deleteFile(file.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1}
            onClick={() => router.push(`/admin/files?page=${page - 1}`)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages}
            onClick={() => router.push(`/admin/files?page=${page + 1}`)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
