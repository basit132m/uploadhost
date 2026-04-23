"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const BANNER_PAGES = [
  { key: "adBanner_homepage", label: "Homepage Banner" },
  { key: "adBanner_download", label: "Download Page Banner" },
  { key: "adBanner_dashboard", label: "Dashboard Banner" },
];

export function AdminAdsClient({ slots, bannerSettings }: {
  slots: any[];
  bannerSettings: Record<string, string>;
}) {
  const [banners, setBanners] = useState<Record<string, string>>(bannerSettings);
  const [saving, setSaving] = useState(false);

  async function saveBanners() {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adBanner_homepage: banners.homepage ?? "",
        adBanner_download: banners.download ?? "",
        adBanner_dashboard: banners.dashboard ?? "",
      }),
    });
    setSaving(false);
    if (res.ok) toast.success("Ad codes saved");
    else toast.error("Failed to save");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Page Banner Slots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {BANNER_PAGES.map(({ key, label }) => {
            const shortKey = key.replace("adBanner_", "");
            return (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Textarea
                  value={banners[shortKey] ?? ""}
                  onChange={(e) => setBanners((prev) => ({ ...prev, [shortKey]: e.target.value }))}
                  rows={4}
                  placeholder="Paste your ad code here (Google AdSense, custom HTML, etc.)"
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Supports any HTML/JavaScript ad code. Leave empty to disable ads on this page.
                </p>
              </div>
            );
          })}
          <Button onClick={saveBanners} disabled={saving}>
            {saving ? "Saving..." : "Save Ad Codes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
