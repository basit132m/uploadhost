import { prisma } from "./db";

const DEFAULTS: Record<string, string> = {
  siteName: "UploadHost",
  siteTagline: "Fast, Secure File Hosting",
  siteLogo: "",
  siteFavicon: "",
  maxFileSize: String(500 * 1024 * 1024), // 500MB
  maxDownloads: "0", // 0 = unlimited
  fileExpiry: "0", // 0 = never
  allowedShare_direct: "true",
  allowedShare_onetime: "true",
  allowedShare_timeexpiry: "true",
  allowedShare_password: "true",
  downloadRedirectUrl: "",
  downloadCountdown: "5",
  captchaEnabled: "false",
  captchaProvider: "hcaptcha",
  captchaSiteKey: "",
  captchaSecretKey: "",
  maintenanceMode: "false",
  maintenanceMessage: "We are currently performing maintenance. Please check back soon.",
  registrationApproval: "auto",
  adBanner_homepage: "",
  adBanner_download: "",
  adBanner_dashboard: "",
  encryptionRules: "{}",
  metaTitle: "UploadHost - Fast, Secure File Hosting",
  metaDescription: "Upload and share files instantly with UploadHost. Fast, secure, and reliable file hosting.",
  ogImage: "",
  robotsTxt: "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: /sitemap.xml",
  countryBlockEnabled: "false",
  apiEnabled: "false",
};

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.adminSetting.findMany();
  const result: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.adminSetting.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? "";
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.adminSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function setSettings(updates: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(updates).map(([key, value]) => setSetting(key, value))
  );
}
