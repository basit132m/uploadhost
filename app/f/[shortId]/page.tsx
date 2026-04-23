import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { DownloadPage } from "@/components/download/download-page";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { shortId: string };
}): Promise<Metadata> {
  const file = await prisma.file.findUnique({
    where: { shortId: params.shortId },
  });
  if (!file) return { title: "File Not Found" };
  return {
    title: `Download ${file.originalName}`,
    description: `Download ${file.originalName} from UploadHost`,
  };
}

export default async function FileDownloadPage({
  params,
  searchParams,
}: {
  params: { shortId: string };
  searchParams: { token?: string; pw?: string };
}) {
  const settings = await getSettings();

  // Look up by shortId (direct file) or by share token
  let file: any = await prisma.file.findUnique({
    where: { shortId: params.shortId },
    include: {
      shares: true,
      user: { select: { id: true, name: true } },
    },
  });

  // If not found as shortId, try as share token
  let share: any = null;
  if (!file) {
    share = await prisma.fileShare.findUnique({
      where: { token: params.shortId },
      include: {
        file: {
          include: {
            user: { select: { id: true, name: true } },
            shares: true,
          },
        },
      },
    });
    if (!share) notFound();
    file = share.file;
  }

  if (!file) notFound();

  // Check file expiry
  if (file.expiresAt && new Date(file.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
          <p className="text-muted-foreground">This file link has expired.</p>
        </div>
      </div>
    );
  }

  // Check max downloads
  if (file.maxDownloads && file.downloadCount >= file.maxDownloads) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Download Limit Reached</h1>
          <p className="text-muted-foreground">This file has reached its maximum download count.</p>
        </div>
      </div>
    );
  }

  const adBanner = settings.adBanner_download ?? "";
  const countdown = Number(settings.downloadCountdown ?? "5");
  const redirectUrl = settings.downloadRedirectUrl ?? "";

  return (
    <DownloadPage
      file={{
        id: file.id,
        shortId: file.shortId,
        originalName: file.originalName,
        extension: file.extension,
        size: file.size.toString(),
        downloadCount: file.downloadCount,
        mimeType: file.mimeType,
      }}
      share={share ? {
        id: share.id,
        shareType: share.shareType,
        token: share.token,
        requiresPassword: share.shareType === "PASSWORD" && !searchParams.pw,
      } : null}
      adBanner={adBanner}
      countdown={countdown}
      redirectUrl={redirectUrl}
      siteName={settings.siteName}
      siteLogo={settings.siteLogo || ""}
    />
  );
}
