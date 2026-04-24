-- Admin user (password: admin123!)
INSERT IGNORE INTO `User` (
  `id`, `email`, `name`, `passwordHash`, `role`, `status`,
  `twoFactorEnabled`, `apiEnabled`, `apiKey`,
  `storageUsed`, `totalDownloads`, `totalUploads`,
  `createdAt`, `updatedAt`
) VALUES (
  'admin001',
  'admin@uploadhost.site',
  'Admin',
  '$2y$12$cVoodl05LR//3Ro8Y/QN6OVR.5QtBK8OX8w5to3v28ELacOACRIT6',
  'ADMIN', 'ACTIVE', 0, 1,
  'admin-api-key-change-in-production',
  0, 0, 0,
  NOW(3), NOW(3)
);

-- Default settings
INSERT IGNORE INTO `AdminSetting` (`key`, `value`, `updatedAt`) VALUES
('siteName', 'UploadHost', NOW(3)),
('siteTagline', 'Fast, Secure File Hosting', NOW(3)),
('maxFileSize', '524288000', NOW(3)),
('fileExpiry', '0', NOW(3)),
('maxDownloads', '0', NOW(3)),
('allowedShare_direct', 'true', NOW(3)),
('allowedShare_onetime', 'true', NOW(3)),
('allowedShare_timeexpiry', 'true', NOW(3)),
('allowedShare_password', 'true', NOW(3)),
('downloadCountdown', '5', NOW(3)),
('downloadRedirectUrl', '', NOW(3)),
('captchaEnabled', 'false', NOW(3)),
('maintenanceMode', 'false', NOW(3)),
('maintenanceMessage', 'We are currently performing maintenance. Please check back soon.', NOW(3)),
('registrationApproval', 'auto', NOW(3)),
('robotsTxt', 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: /sitemap.xml', NOW(3)),
('metaTitle', 'UploadHost - Fast, Secure File Hosting', NOW(3)),
('metaDescription', 'Upload and share files instantly with UploadHost.', NOW(3));

-- Default pages
INSERT IGNORE INTO `CustomPage` (`id`, `slug`, `title`, `content`, `published`, `createdAt`, `updatedAt`) VALUES
('page001', 'terms-of-service', 'Terms of Service', '<h2>Terms of Service</h2><p>By using UploadHost, you agree to these terms...</p>', 1, NOW(3), NOW(3)),
('page002', 'privacy-policy', 'Privacy Policy', '<h2>Privacy Policy</h2><p>We respect your privacy...</p>', 1, NOW(3), NOW(3)),
('page003', 'about', 'About Us', '<h2>About UploadHost</h2><p>UploadHost is a fast, secure file hosting platform...</p>', 1, NOW(3), NOW(3));
