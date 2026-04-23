import nodemailer from "nodemailer";

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const from = () => process.env.SMTP_FROM ?? "UploadHost <no-reply@uploadhost.site>";
const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://uploadhost.site";

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const transport = getTransport();
  await transport.sendMail({
    from: from(),
    to: email,
    subject: "Welcome to UploadHost!",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#4f46e5">Welcome to UploadHost!</h1>
        <p>Hi ${name || "there"},</p>
        <p>Your account has been successfully created. You can now upload and share files at lightning speed.</p>
        <a href="${appUrl()}/dashboard" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
          Go to Dashboard
        </a>
        <p style="margin-top:32px;color:#6b7280;font-size:14px">If you didn't create this account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const transport = getTransport();
  const resetUrl = `${appUrl()}/reset-password?token=${token}`;
  await transport.sendMail({
    from: from(),
    to: email,
    subject: "Reset your UploadHost password",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#4f46e5">Reset Your Password</h1>
        <p>We received a request to reset your password. Click the button below to create a new password.</p>
        <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
          Reset Password
        </a>
        <p style="margin-top:16px;color:#6b7280;font-size:14px">This link expires in 1 hour.</p>
        <p style="color:#6b7280;font-size:14px">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPendingApprovalEmail(email: string): Promise<void> {
  const transport = getTransport();
  await transport.sendMail({
    from: from(),
    to: email,
    subject: "Your UploadHost account is pending approval",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#4f46e5">Account Pending Approval</h1>
        <p>Thank you for registering on UploadHost. Your account is currently pending admin approval.</p>
        <p>You'll receive an email once your account has been approved.</p>
      </div>
    `,
  });
}

export async function sendAccountApprovedEmail(email: string, name: string): Promise<void> {
  const transport = getTransport();
  await transport.sendMail({
    from: from(),
    to: email,
    subject: "Your UploadHost account has been approved!",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#4f46e5">Account Approved!</h1>
        <p>Hi ${name || "there"},</p>
        <p>Great news! Your UploadHost account has been approved. You can now log in and start uploading files.</p>
        <a href="${appUrl()}/login" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
          Log In Now
        </a>
      </div>
    `,
  });
}
