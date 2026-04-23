"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Plus, Edit2, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface CustomPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDesc: string | null;
  published: boolean;
  createdAt: Date;
}

export function AdminPagesClient({ pages: initialPages }: { pages: CustomPage[] }) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [dialog, setDialog] = useState<{ open: boolean; page?: CustomPage }>({ open: false });
  const [form, setForm] = useState({ title: "", slug: "", content: "", metaTitle: "", metaDesc: "", published: true });
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm({ title: "", slug: "", content: "", metaTitle: "", metaDesc: "", published: true });
    setDialog({ open: true });
  }

  function openEdit(page: CustomPage) {
    setForm({
      title: page.title,
      slug: page.slug,
      content: page.content,
      metaTitle: page.metaTitle ?? "",
      metaDesc: page.metaDesc ?? "",
      published: page.published,
    });
    setDialog({ open: true, page });
  }

  async function save() {
    setSaving(true);
    const isEdit = !!dialog.page;
    const url = isEdit ? `/api/admin/pages/${dialog.page!.id}` : "/api/admin/pages";
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      if (isEdit) {
        setPages((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      } else {
        setPages((prev) => [data, ...prev]);
      }
      setDialog({ open: false });
      toast.success(isEdit ? "Page updated" : "Page created");
    } else {
      toast.error("Failed to save page");
    }
  }

  async function deletePage(id: string) {
    if (!confirm("Delete this page?")) return;
    const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPages((prev) => prev.filter((p) => p.id !== id));
      toast.success("Page deleted");
    }
  }

  function slugify(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  return (
    <div className="space-y-4">
      <Button onClick={openCreate}>
        <Plus className="w-4 h-4 mr-2" /> New Page
      </Button>

      <div className="space-y-3">
        {pages.length === 0 && (
          <p className="text-muted-foreground text-sm">No custom pages yet. Create your first page!</p>
        )}
        {pages.map((page) => (
          <Card key={page.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{page.title}</span>
                  <Badge variant={page.published ? "success" : "secondary"}>
                    {page.published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground font-mono">/p/{page.slug}</span>
                  <a
                    href={`/p/${page.slug}`}
                    target="_blank"
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> View
                  </a>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(page)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => deletePage(page.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialog.open} onOpenChange={(o) => !o && setDialog({ open: false })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialog.page ? "Edit Page" : "New Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      title: e.target.value,
                      slug: dialog.page ? f.slug : slugify(e.target.value),
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="about-us"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content (HTML supported)</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={form.metaTitle}
                  onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Input
                  value={form.metaDesc}
                  onChange={(e) => setForm((f) => ({ ...f, metaDesc: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Published</Label>
              <Switch
                checked={form.published}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, published: checked }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save Page"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
