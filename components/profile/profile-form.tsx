"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, QrCode, Key } from "lucide-react";
import Image from "next/image";

interface ProfileFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    bio: string | null;
    twoFactorEnabled: boolean;
    apiEnabled: boolean;
    apiKey: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [twoFA, setTwoFA] = useState(user.twoFactorEnabled);
  const [qrCode, setQrCode] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  async function saveProfile() {
    setSaving(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio }),
    });
    setSaving(false);
    if (res.ok) toast.success("Profile updated");
    else toast.error("Failed to update profile");
  }

  async function changePassword() {
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    if (res.ok) {
      toast.success("Password changed");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Failed");
    }
  }

  async function setup2FA() {
    const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
    const data = await res.json();
    setQrCode(data.qrCode);
    setTotpSecret(data.secret);
    setShowQr(true);
  }

  async function verify2FA(enable: boolean) {
    const res = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: verifyCode, enable }),
    });
    if (res.ok) {
      setTwoFA(enable);
      setShowQr(false);
      toast.success(enable ? "2FA enabled" : "2FA disabled");
    } else {
      toast.error("Invalid code");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {user.image && (
            <div className="flex items-center gap-4">
              <Image
                src={user.image}
                alt={user.name ?? ""}
                width={64}
                height={64}
                className="rounded-full"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>
          <Button onClick={saveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>
          <Button onClick={changePassword}>Update Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Two-Factor Authentication</CardTitle>
            <Badge variant={twoFA ? "success" : "secondary"}>
              {twoFA ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account using an authenticator app.
          </p>
          {!showQr ? (
            <Button
              variant={twoFA ? "destructive" : "default"}
              onClick={twoFA ? () => setShowQr(true) : setup2FA}
            >
              {twoFA ? "Disable 2FA" : "Enable 2FA"}
            </Button>
          ) : (
            <div className="space-y-4">
              {qrCode && (
                <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-muted">
                  <QrCode className="w-5 h-5 text-muted-foreground" />
                  <Image src={qrCode} alt="QR Code" width={160} height={160} />
                  <p className="text-xs text-muted-foreground font-mono break-all">{totpSecret}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="000000"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowQr(false)}>Cancel</Button>
                <Button onClick={() => verify2FA(!twoFA)}>
                  {twoFA ? "Confirm Disable" : "Confirm Enable"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {user.apiEnabled && user.apiKey && (
        <Card>
          <CardHeader><CardTitle>API Access</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Use this key to access the UploadHost API programmatically.
            </p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
              <Key className="w-4 h-4 shrink-0" />
              <span className="truncate">{user.apiKey}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto"
                onClick={() => {
                  navigator.clipboard.writeText(user.apiKey!);
                  toast.success("API key copied");
                }}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
