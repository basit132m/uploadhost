# UploadHost

A fast, secure file hosting platform built with Next.js 14, PostgreSQL, and S3-compatible storage.

## Features

- **Authentication**: Email/Password + Google OAuth, optional 2FA (TOTP)
- **Upload Engine**: Chunked + resumable + parallel uploads (5MB chunks, 3 concurrent)
- **File Types**: All file types except video, audio, images, and GIFs
- **File Management**: Folders, tags, rename, move, copy, delete, bulk actions, ZIP download
- **Sharing**: Short links (`/f/[id]`), one-time links, time-expiry, password-protected links
- **Download Page**: Countdown timer, banner ads, configurable redirect link
- **Admin Panel**: Full control over users, files, settings, analytics, ads, pages, logs
- **Storage**: S3-compatible (Cloudflare R2 recommended, also supports AWS S3, Backblaze B2, etc.)
- **SEO**: Per-page meta tags, Open Graph, sitemap.xml, robots.txt
- **Themes**: Light/Dark mode with user toggle

## Quick Start

### 1. Clone and Install
```bash
git clone <repo>
cd uploadhost
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Setup Database
```bash
npm run db:push
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Access
- App: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
- Default admin: `admin@uploadhost.site` / `admin123!`

## Production Deployment (Hostinger VPS)

### Prerequisites
- Ubuntu 22.04 VPS
- Node.js 20+
- PostgreSQL 15+
- PM2
- Nginx
- Cloudflare (optional, recommended)

### Setup
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install and setup PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb uploadhost
sudo -u postgres createuser uploadhost_user
sudo -u postgres psql -c "GRANT ALL ON DATABASE uploadhost TO uploadhost_user;"

# Clone and build
cd /var/www
git clone <repo> uploadhost
cd uploadhost
npm install
cp .env.example .env
# Edit .env with production credentials
npm run db:push
npm run db:seed
npm run build

# Start with PM2
pm2 start npm --name "uploadhost" -- start
pm2 save
pm2 startup
```

### Nginx Configuration
```nginx
server {
    server_name uploadhost.site www.uploadhost.site;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 600M;
    }
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Your site URL |
| `NEXTAUTH_SECRET` | Random secret (use `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `S3_ENDPOINT` | S3 endpoint URL |
| `S3_ACCESS_KEY_ID` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | S3 secret key |
| `S3_BUCKET_NAME` | S3 bucket name |
| `S3_REGION` | S3 region (use "auto" for R2) |
| `S3_PUBLIC_URL` | Public CDN URL for files |
| `SMTP_HOST` | SMTP host for emails |
| `SMTP_PORT` | SMTP port (587 for TLS) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `NEXT_PUBLIC_APP_URL` | Your public site URL |

## Architecture

```
uploadhost/
├── app/                    # Next.js App Router pages & API routes
│   ├── (auth)/             # Login, register, reset password
│   ├── (dashboard)/        # User dashboard, files, profile, settings
│   ├── admin/              # Admin panel
│   ├── f/[shortId]/        # Download page
│   ├── p/[slug]/           # Custom static pages
│   └── api/                # API routes
├── components/             # React components
│   ├── ui/                 # Base UI components (shadcn-style)
│   ├── upload/             # Upload zone with chunked upload
│   ├── files/              # File manager
│   ├── dashboard/          # Dashboard charts
│   ├── admin/              # Admin components
│   ├── download/           # Download page
│   └── profile/            # Profile form
├── lib/                    # Server utilities
│   ├── auth.ts             # NextAuth.js config
│   ├── db.ts               # Prisma client
│   ├── storage.ts          # S3 storage operations
│   ├── settings.ts         # Admin settings
│   ├── email.ts            # Email sending
│   └── utils.ts            # Utility functions
└── prisma/                 # Database schema & migrations
```
