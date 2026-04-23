"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatDate, getFileIcon, cn } from "@/lib/utils";
import {
  Search, FolderPlus, Trash2, Download, Share2, Tag, FolderOpen,
  ChevronRight, MoreHorizontal, RefreshCw, CheckSquare, Archive,
  Edit2, Move, Copy,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface FileItem {
  id: string;
  shortId: string;
  originalName: string;
  extension: string;
  size: string;
  downloadCount: number;
  tags: string[];
  folderId: string | null;
  createdAt: string;
  shares: { id: string; shareType: string; token: string }[];
}

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  _count: { files: number; children: number };
}

export function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tagFilter, setTagFilter] = useState("");
  const [extFilter, setExtFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dialog, setDialog] = useState<{
    type: "rename" | "share" | "tag" | "new-folder" | "move" | null;
    fileId?: string;
    fileName?: string;
  }>({ type: null });

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search, page: String(page), sort: sortBy, order: sortOrder,
        ...(currentFolder ? { folderId: currentFolder } : {}),
        ...(tagFilter ? { tag: tagFilter } : {}),
        ...(extFilter ? { ext: extFilter } : {}),
      });
      const res = await fetch(`/api/files?${params}`);
      const data = await res.json();
      setFiles(data.files ?? []);
      setTotalPages(data.pages ?? 1);
    } catch {
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [search, page, sortBy, sortOrder, currentFolder, tagFilter, extFilter]);

  const fetchFolders = useCallback(async () => {
    const params = new URLSearchParams(currentFolder ? { parentId: currentFolder } : {});
    const res = await fetch(`/api/folders?${params}`);
    const data = await res.json();
    setFolders(data);
  }, [currentFolder]);

  useEffect(() => { fetchFiles(); fetchFolders(); }, [fetchFiles, fetchFolders]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === files.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(files.map((f) => f.id)));
    }
  }

  async function deleteSelected() {
    if (!confirm(`Delete ${selected.size} file(s)?`)) return;
    const res = await fetch("/api/files/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: Array.from(selected), action: "delete" }),
    });
    if (res.ok) {
      toast.success("Files deleted");
      setSelected(new Set());
      fetchFiles();
    } else {
      toast.error("Failed to delete files");
    }
  }

  async function downloadZip() {
    const fileIds = Array.from(selected);
    const res = await fetch("/api/files/zip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "files.zip";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast.error("ZIP download failed");
    }
  }

  async function createFolder(name: string) {
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: currentFolder }),
    });
    if (res.ok) {
      toast.success("Folder created");
      fetchFolders();
    } else {
      toast.error("Failed to create folder");
    }
  }

  async function renameFile(fileId: string, name: string) {
    await fetch(`/api/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    fetchFiles();
  }

  async function deleteFile(fileId: string) {
    if (!confirm("Delete this file?")) return;
    const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
    if (res.ok) { toast.success("File deleted"); fetchFiles(); }
    else toast.error("Failed to delete");
  }

  function openFolder(folder: FolderItem) {
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolder(folder.id);
    setPage(1);
  }

  function navigateBreadcrumb(index: number) {
    if (index === -1) {
      setFolderPath([]);
      setCurrentFolder(null);
    } else {
      const item = folderPath[index];
      setFolderPath((prev) => prev.slice(0, index + 1));
      setCurrentFolder(item.id);
    }
    setPage(1);
  }

  const shareUrl = (shortId: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/f/${shortId}` : `/f/${shortId}`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Input
          placeholder="Filter by tag"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="w-32"
        />
        <Input
          placeholder="Extension"
          value={extFilter}
          onChange={(e) => setExtFilter(e.target.value)}
          className="w-24"
        />
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Date</SelectItem>
            <SelectItem value="originalName">Name</SelectItem>
            <SelectItem value="size">Size</SelectItem>
            <SelectItem value="downloadCount">Downloads</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchFiles}>
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialog({ type: "new-folder" })}
        >
          <FolderPlus className="w-4 h-4 mr-1" /> New Folder
        </Button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <button onClick={() => navigateBreadcrumb(-1)} className="hover:text-foreground">
          All Files
        </button>
        {folderPath.map((f, i) => (
          <span key={f.id} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            <button
              onClick={() => navigateBreadcrumb(i)}
              className={i === folderPath.length - 1 ? "text-foreground font-medium" : "hover:text-foreground"}
            >
              {f.name}
            </button>
          </span>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={downloadZip}>
              <Archive className="w-4 h-4 mr-1" /> Download ZIP
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteSelected}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => openFolder(folder)}
              className="flex flex-col items-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-center"
            >
              <FolderOpen className="w-8 h-8 text-yellow-500 mb-2" />
              <span className="text-sm font-medium truncate w-full">{folder.name}</span>
              <span className="text-xs text-muted-foreground">
                {folder._count.files} files
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Files */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={files.length > 0 && selected.size === files.length}
                  onChange={selectAll}
                  className="rounded"
                />
              </th>
              <th className="p-3 text-left font-medium">Name</th>
              <th className="p-3 text-left font-medium hidden sm:table-cell">Size</th>
              <th className="p-3 text-left font-medium hidden md:table-cell">Downloads</th>
              <th className="p-3 text-left font-medium hidden lg:table-cell">Tags</th>
              <th className="p-3 text-left font-medium hidden md:table-cell">Date</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No files found
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr
                  key={file.id}
                  className={cn(
                    "border-b hover:bg-muted/30 transition-colors",
                    selected.has(file.id) && "bg-primary/5"
                  )}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(file.id)}
                      onChange={() => toggleSelect(file.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span>{getFileIcon(file.extension)}</span>
                      <span className="font-medium truncate max-w-[200px]">{file.originalName}</span>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-muted-foreground">
                    {formatBytes(Number(file.size))}
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">
                    {file.downloadCount}
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {file.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">
                    {formatDate(file.createdAt)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl(file.shortId));
                          toast.success("Share link copied!");
                        }}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDialog({ type: "rename", fileId: file.id, fileName: file.originalName })}>
                            <Edit2 className="w-4 h-4 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDialog({ type: "share", fileId: file.id })}>
                            <Share2 className="w-4 h-4 mr-2" /> Share Options
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDialog({ type: "tag", fileId: file.id })}>
                            <Tag className="w-4 h-4 mr-2" /> Manage Tags
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDialog({ type: "move", fileId: file.id })}>
                            <Move className="w-4 h-4 mr-2" /> Move to Folder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteFile(file.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <FileDialogs
        dialog={dialog}
        onClose={() => setDialog({ type: null })}
        onRename={renameFile}
        onCreateFolder={createFolder}
        onRefresh={fetchFiles}
        folders={folders}
      />
    </div>
  );
}

function FileDialogs({
  dialog, onClose, onRename, onCreateFolder, onRefresh, folders,
}: {
  dialog: any;
  onClose: () => void;
  onRename: (id: string, name: string) => void;
  onCreateFolder: (name: string) => void;
  onRefresh: () => void;
  folders: FolderItem[];
}) {
  const [value, setValue] = useState("");
  const [shareType, setShareType] = useState("DIRECT");
  const [sharePassword, setSharePassword] = useState("");
  const [expiryHours, setExpiryHours] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [targetFolder, setTargetFolder] = useState("");

  useEffect(() => {
    if (dialog.fileName) setValue(dialog.fileName);
    else setValue("");
  }, [dialog]);

  async function handleShare() {
    const res = await fetch(`/api/files/${dialog.fileId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shareType,
        password: sharePassword || undefined,
        expiryHours: expiryHours ? Number(expiryHours) : undefined,
      }),
    });
    if (res.ok) {
      const { token } = await res.json();
      const url = `${window.location.origin}/f/${token}`;
      navigator.clipboard.writeText(url);
      toast.success("Share link created and copied!");
      onClose();
    } else {
      toast.error("Failed to create share link");
    }
  }

  async function handleTag() {
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    await fetch(`/api/files/${dialog.fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    onRefresh();
    onClose();
    toast.success("Tags updated");
  }

  async function handleMove() {
    await fetch(`/api/files/${dialog.fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: targetFolder || null }),
    });
    onRefresh();
    onClose();
    toast.success("File moved");
  }

  return (
    <>
      <Dialog open={dialog.type === "rename"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename File</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New name</Label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => { onRename(dialog.fileId!, value); onClose(); }}>
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "new-folder"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Folder name</Label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="My Folder" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => { onCreateFolder(value); onClose(); }}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "share"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Share Options</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Share type</Label>
              <Select value={shareType} onValueChange={setShareType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT">Direct link</SelectItem>
                  <SelectItem value="ONE_TIME">One-time link</SelectItem>
                  <SelectItem value="TIME_EXPIRY">Time expiry</SelectItem>
                  <SelectItem value="PASSWORD">Password protected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {shareType === "PASSWORD" && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                />
              </div>
            )}
            {shareType === "TIME_EXPIRY" && (
              <div className="space-y-2">
                <Label>Expires in (hours)</Label>
                <Input
                  type="number"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                  placeholder="24"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleShare}>Create Link</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "tag"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage Tags</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="work, important, project-a"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleTag}>Save Tags</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "move"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move to Folder</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Destination</Label>
              <Select value={targetFolder} onValueChange={setTargetFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Root (no folder)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Root</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleMove}>Move</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
