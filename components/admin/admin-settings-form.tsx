"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function AdminSettingsForm({ settings }: { settings: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(settings);
  const [saving, setSaving] = useState(false);

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function save(keys: string[]) {
    setSaving(true);
    const updates: Record<string, string> = {};
    keys.forEach((k) => (updates[k] = values[k] ?? ""));
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaving(false);
    if (res.ok) toast.success("Settings saved");
    else toast.error("Failed to save");
  }

  return (
    <Tabs defaultValue="general">
      <TabsList className="mb-4 flex-wrap h-auto">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="uploads">Uploads</TabsTrigger>
        <TabsTrigger value="sharing">Sharing</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="storage">Storage</TabsTrigger>
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card>
          <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input value={values.siteName ?? ""} onChange={(e) => set("siteName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Site Tagline</Label>
              <Input value={values.siteTagline ?? ""} onChange={(e) => set("siteTagline", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Registration Approval</Label>
              <Select value={values.registrationApproval ?? "auto"} onValueChange={(v) => set("registrationApproval", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatic (instant activation)</SelectItem>
                  <SelectItem value="manual">Manual (admin approval required)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => save(["siteName", "siteTagline", "registrationApproval"])} disabled={saving}>
              Save
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="uploads">
        <Card>
          <CardHeader><CardTitle>Upload Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Maximum File Size (bytes)</Label>
              <Input
                type="number"
                value={values.maxFileSize ?? ""}
                onChange={(e) => set("maxFileSize", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Current: {Math.round(Number(values.maxFileSize ?? 0) / (1024 * 1024))} MB
              </p>
            </div>
            <div className="space-y-2">
              <Label>File Expiry (days, 0 = never)</Label>
              <Input
                type="number"
                value={values.fileExpiry ?? "0"}
                onChange={(e) => set("fileExpiry", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Downloads per File (0 = unlimited)</Label>
              <Input
                type="number"
                value={values.maxDownloads ?? "0"}
                onChange={(e) => set("maxDownloads", e.target.value)}
              />
            </div>
            <Button onClick={() => save(["maxFileSize", "fileExpiry", "maxDownloads"])} disabled={saving}>
              Save
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sharing">
        <Card>
          <CardHeader><CardTitle>Sharing Options</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "allowedShare_direct", label: "Direct Links" },
              { key: "allowedShare_onetime", label: "One-Time Links" },
              { key: "allowedShare_timeexpiry", label: "Time-Expiry Links" },
              { key: "allowedShare_password", label: "Password-Protected Links" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label>{label}</Label>
                <Switch
                  checked={values[key] !== "false"}
                  onCheckedChange={(checked) => set(key, checked ? "true" : "false")}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label>Download Countdown (seconds)</Label>
              <Input
                type="number"
                value={values.downloadCountdown ?? "5"}
                onChange={(e) => set("downloadCountdown", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Download Redirect URL (first click)</Label>
              <Input
                value={values.downloadRedirectUrl ?? ""}
                onChange={(e) => set("downloadRedirectUrl", e.target.value)}
                placeholder="https://example.com/affiliate"
              />
            </div>
            <Button
              onClick={() => save([
                "allowedShare_direct", "allowedShare_onetime",
                "allowedShare_timeexpiry", "allowedShare_password",
                "downloadCountdown", "downloadRedirectUrl",
              ])}
              disabled={saving}
            >
              Save
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>CAPTCHA</Label>
                <p className="text-xs text-muted-foreground">Protect registration/login from bots</p>
              </div>
              <Switch
                checked={values.captchaEnabled === "true"}
                onCheckedChange={(checked) => set("captchaEnabled", checked ? "true" : "false")}
              />
            </div>
            {values.captchaEnabled === "true" && (
              <>
                <div className="space-y-2">
                  <Label>CAPTCHA Provider</Label>
                  <Select value={values.captchaProvider ?? "hcaptcha"} onValueChange={(v) => set("captchaProvider", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hcaptcha">hCaptcha</SelectItem>
                      <SelectItem value="recaptcha">Google reCAPTCHA v2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Site Key</Label>
                  <Input value={values.captchaSiteKey ?? ""} onChange={(e) => set("captchaSiteKey", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <Input type="password" value={values.captchaSecretKey ?? ""} onChange={(e) => set("captchaSecretKey", e.target.value)} />
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <div>
                <Label>Global API Access</Label>
                <p className="text-xs text-muted-foreground">Allow admin to enable API per user</p>
              </div>
              <Switch
                checked={values.apiEnabled === "true"}
                onCheckedChange={(checked) => set("apiEnabled", checked ? "true" : "false")}
              />
            </div>
            <Button onClick={() => save(["captchaEnabled", "captchaProvider", "captchaSiteKey", "captchaSecretKey", "apiEnabled"])} disabled={saving}>
              Save
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="storage">
        <Card>
          <CardHeader><CardTitle>Storage Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure S3-compatible storage. These settings override environment variables and are stored securely.
            </p>
            {[
              { key: "s3Endpoint", label: "S3 Endpoint", placeholder: "https://<id>.r2.cloudflarestorage.com" },
              { key: "s3AccessKey", label: "Access Key ID", placeholder: "" },
              { key: "s3SecretKey", label: "Secret Access Key", placeholder: "", type: "password" },
              { key: "s3Bucket", label: "Bucket Name", placeholder: "uploadhost-files" },
              { key: "s3Region", label: "Region", placeholder: "auto" },
              { key: "s3PublicUrl", label: "Public URL (CDN)", placeholder: "https://files.uploadhost.site" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  type={type ?? "text"}
                  value={values[key] ?? ""}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                />
              </div>
            ))}
            <Button onClick={() => save(["s3Endpoint", "s3AccessKey", "s3SecretKey", "s3Bucket", "s3Region", "s3PublicUrl"])} disabled={saving}>
              Save Storage Config
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="branding">
        <Card>
          <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={values.siteLogo ?? ""}
                onChange={(e) => set("siteLogo", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Favicon URL</Label>
              <Input
                value={values.siteFavicon ?? ""}
                onChange={(e) => set("siteFavicon", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input
                value={values.metaTitle ?? ""}
                onChange={(e) => set("metaTitle", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea
                value={values.metaDescription ?? ""}
                onChange={(e) => set("metaDescription", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Robots.txt</Label>
              <Textarea
                value={values.robotsTxt ?? ""}
                onChange={(e) => set("robotsTxt", e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
            </div>
            <Button onClick={() => save(["siteLogo", "siteFavicon", "metaTitle", "metaDescription", "robotsTxt"])} disabled={saving}>
              Save
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="maintenance">
        <Card>
          <CardHeader><CardTitle>Maintenance Mode</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">Non-admin users see a maintenance page</p>
              </div>
              <Switch
                checked={values.maintenanceMode === "true"}
                onCheckedChange={(checked) => set("maintenanceMode", checked ? "true" : "false")}
              />
            </div>
            <div className="space-y-2">
              <Label>Maintenance Message</Label>
              <Textarea
                value={values.maintenanceMessage ?? ""}
                onChange={(e) => set("maintenanceMessage", e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={() => save(["maintenanceMode", "maintenanceMessage"])} disabled={saving}>
              Save
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
