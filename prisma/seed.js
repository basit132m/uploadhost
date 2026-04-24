'use strict';
const path = require('path');
const fs = require('fs');

// Load .env manually (no dotenv package needed)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0 && !line.startsWith('#')) {
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set.');
  console.error('Run: export DATABASE_URL="mysql://user:pass@localhost:3306/dbname"');
  process.exit(1);
}

const nodeModules = path.join(__dirname, '..', 'node_modules');
const bcrypt = require(path.join(nodeModules, 'bcryptjs'));
const { PrismaClient } = require(path.join(nodeModules, '@prisma', 'client'));

async function seed() {
  const prisma = new PrismaClient();
  try {
    console.log('Seeding database...');

    const passwordHash = await bcrypt.hash('admin123!', 12);
    await prisma.user.upsert({
      where: { email: 'admin@uploadhost.site' },
      update: {},
      create: {
        email: 'admin@uploadhost.site',
        name: 'Admin',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        apiEnabled: true,
        apiKey: 'admin-api-key-change-in-production',
      },
    });
    console.log('Admin user created');

    const settings = [
      ['siteName', 'UploadHost'],
      ['siteTagline', 'Fast, Secure File Hosting'],
      ['maxFileSize', String(500 * 1024 * 1024)],
      ['fileExpiry', '0'],
      ['maxDownloads', '0'],
      ['allowedShare_direct', 'true'],
      ['allowedShare_onetime', 'true'],
      ['allowedShare_timeexpiry', 'true'],
      ['allowedShare_password', 'true'],
      ['downloadCountdown', '5'],
      ['downloadRedirectUrl', ''],
      ['captchaEnabled', 'false'],
      ['maintenanceMode', 'false'],
      ['maintenanceMessage', 'We are currently performing maintenance. Please check back soon.'],
      ['registrationApproval', 'auto'],
      ['robotsTxt', 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: /sitemap.xml'],
      ['metaTitle', 'UploadHost - Fast, Secure File Hosting'],
      ['metaDescription', 'Upload and share files instantly with UploadHost.'],
    ];
    for (const [key, value] of settings) {
      await prisma.adminSetting.upsert({ where: { key }, update: {}, create: { key, value } });
    }
    console.log('Settings created');

    const pages = [
      { slug: 'terms-of-service', title: 'Terms of Service', content: '<h2>Terms of Service</h2><p>By using UploadHost, you agree to these terms...</p>', published: true },
      { slug: 'privacy-policy', title: 'Privacy Policy', content: '<h2>Privacy Policy</h2><p>We respect your privacy...</p>', published: true },
      { slug: 'about', title: 'About Us', content: '<h2>About UploadHost</h2><p>UploadHost is a fast, secure file hosting platform...</p>', published: true },
    ];
    for (const page of pages) {
      await prisma.customPage.upsert({ where: { slug: page.slug }, update: {}, create: page });
    }
    console.log('Pages created');

    console.log('\nSeed complete!');
    console.log('Admin login: admin@uploadhost.site / admin123!');
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch(e => { console.error(e); process.exit(1); });
