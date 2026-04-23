import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@uploadhost.site" },
    update: {},
    create: {
      email: "admin@uploadhost.site",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      apiEnabled: true,
      apiKey: "admin-api-key-change-in-production",
    },
  });
  console.log("Admin user:", admin.email);

  // Default settings
  const defaultSettings = [
    { key: "siteName", value: "UploadHost" },
    { key: "siteTagline", value: "Fast, Secure File Hosting" },
    { key: "maxFileSize", value: String(500 * 1024 * 1024) },
    { key: "fileExpiry", value: "0" },
    { key: "maxDownloads", value: "0" },
    { key: "allowedShare_direct", value: "true" },
    { key: "allowedShare_onetime", value: "true" },
    { key: "allowedShare_timeexpiry", value: "true" },
    { key: "allowedShare_password", value: "true" },
    { key: "downloadCountdown", value: "5" },
    { key: "downloadRedirectUrl", value: "" },
    { key: "captchaEnabled", value: "false" },
    { key: "maintenanceMode", value: "false" },
    { key: "maintenanceMessage", value: "We are currently performing maintenance. Please check back soon." },
    { key: "registrationApproval", value: "auto" },
    { key: "robotsTxt", value: "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: /sitemap.xml" },
    { key: "metaTitle", value: "UploadHost - Fast, Secure File Hosting" },
    { key: "metaDescription", value: "Upload and share files instantly with UploadHost." },
  ];

  for (const s of defaultSettings) {
    await prisma.adminSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // Default pages
  const defaultPages = [
    {
      slug: "terms-of-service",
      title: "Terms of Service",
      content: "<h2>Terms of Service</h2><p>By using UploadHost, you agree to these terms...</p>",
      published: true,
    },
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      content: "<h2>Privacy Policy</h2><p>We respect your privacy...</p>",
      published: true,
    },
    {
      slug: "about",
      title: "About Us",
      content: "<h2>About UploadHost</h2><p>UploadHost is a fast, secure file hosting platform...</p>",
      published: true,
    },
  ];

  for (const page of defaultPages) {
    await prisma.customPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }

  console.log("Seed complete!");
  console.log("Admin login: admin@uploadhost.site / admin123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
