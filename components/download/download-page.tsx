"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { formatBytes, getFileIcon } from "@/lib/utils";
import { Download, Upload, Lock, AlertCircle, Flag } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface DownloadPageProps {
  file: {
    id: string;
    shortId: string;
    originalName: string;
    extension: string;
    size: string;
    downloadCount: number;
    mimeType: string;
  };
  share: {
    id: string;
    shareType: string;
    token: string;
    requiresPassword: boolean;
  } | null;
  adBanner: string;
  countdown: number;
  redirectUrl: string;
  siteName: string;
  siteLogo: string;
}

export function DownloadPage({
  file, share, adBanner, countdown, redirectUrl, siteName, siteLogo,
}: DownloadPageProps) {
  const { data: session } = useSession();
  const [timer, setTimer] = useState(countdown);
  const [ready, setReady] = useState(countdown === 0);
  const [firstClick, setFirstClick] = useState(true);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (share?.requiresPassword) return;
    if (countdown <= 0) { setReady(true); return; }
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setReady(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown, share?.requiresPassword]);

  async function verifyPassword() {
    const res = await fetch(`/api/files/${file.id}/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareToken: share?.token, password }),
    });
    if (res.status === 403) {
      setPasswordError("Incorrect password");
    } else if (res.ok) {
      setPasswordError("");
      triggerDownload();
    }
  }

  async function handleDownloadClick() {
    if (redirectUrl && firstClick) {
      setFirstClick(false);
      window.open(redirectUrl, "_blank");
      return;
    }
    triggerDownload();
  }

  async function triggerDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/files/${file.id}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareToken: share?.token,
          password: share?.shareType === "PASSWORD" ? password : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Download failed");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  }

  async function submitReport() {
    if (!reportReason) return;
    const res = await fetch(`/api/files/${file.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reportReason }),
    });
    if (res.ok) {
      toast.success("Report submitted");
      setReportOpen(false);
    } else {
      toast.error("Failed to submit report");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b p-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          {siteLogo ? (
            <Image src={siteLogo} alt={siteName} width={28} height={28} className="rounded" />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          <span className="font-semibold">{siteName}</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
        {/* Ad Banner Top */}
        {adBanner && (
          <div
            className="w-full max-w-2xl"
            dangerouslySetInnerHTML={{ __html: adBanner }}
          />
        )}

        {/* File Card */}
        <div className="w-full max-w-md">
          <div className="border rounded-xl p-8 bg-card text-center space-y-6">
            <div className="text-6xl">{getFileIcon(file.extension)}</div>
            <div>
              <h1 className="text-xl font-bold break-all">{file.originalName}</h1>
              <p className="text-muted-foreground mt-1">
                {formatBytes(Number(file.size))} · {file.downloadCount} downloads
              </p>
            </div>

            {share?.requiresPassword ? (
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">This file is password protected</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw">Password</Label>
                  <Input
                    id="pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
                  />
                  {passwordError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {passwordError}
                    </p>
                  )}
                </div>
                <Button className="w-full" onClick={verifyPassword}>
                  <Lock className="w-4 h-4 mr-2" /> Unlock & Download
                </Button>
              </div>
            ) : !ready ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Download starts in <span className="font-bold text-primary">{timer}</span> seconds
                </p>
                <Progress value={((countdown - timer) / countdown) * 100} className="h-2" />
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full"
                onClick={handleDownloadClick}
                disabled={downloading}
              >
                <Download className="w-5 h-5 mr-2" />
                {downloading ? "Downloading..." : redirectUrl && firstClick ? "Continue to Download" : "Download File"}
              </Button>
            )}
          </div>

          {/* Report */}
          {session && (
            <div className="mt-4 text-center">
              {!reportOpen ? (
                <button
                  onClick={() => setReportOpen(true)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
                >
                  <Flag className="w-3 h-3" /> Report this file
                </button>
              ) : (
                <div className="border rounded-lg p-4 space-y-3 text-left">
                  <p className="text-sm font-medium">Report this file</p>
                  <Input
                    placeholder="Reason (e.g. illegal content, spam)"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setReportOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="destructive" onClick={submitReport}>
                      Submit Report
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ad Banner Bottom */}
        {adBanner && (
          <div
            className="w-full max-w-2xl"
            dangerouslySetInnerHTML={{ __html: adBanner }}
          />
        )}
      </main>
    </div>
  );
}
