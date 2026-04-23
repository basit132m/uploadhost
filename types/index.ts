export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "BANNED";
export type ShareType = "DIRECT" | "ONE_TIME" | "TIME_EXPIRY" | "PASSWORD";
export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";

export interface FileWithShare {
  id: string;
  shortId: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: bigint;
  downloadCount: number;
  maxDownloads: number | null;
  expiresAt: Date | null;
  tags: string[];
  folderId: string | null;
  createdAt: Date;
  shares: {
    id: string;
    shareType: ShareType;
    token: string;
    expiresAt: Date | null;
    maxDownloads: number | null;
    downloadCount: number;
  }[];
}

export interface UploadChunkRequest {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
}

export interface InitUploadResponse {
  uploadSessionId: string;
  storageKey: string;
}

export interface AdminSettings {
  siteName: string;
  siteTagline: string;
  siteLogo: string;
  siteFavicon: string;
  maxFileSize: string;
  maxDownloads: string;
  fileExpiry: string;
  allowedShare_direct: string;
  allowedShare_onetime: string;
  allowedShare_timeexpiry: string;
  allowedShare_password: string;
  downloadRedirectUrl: string;
  downloadCountdown: string;
  captchaEnabled: string;
  captchaSiteKey: string;
  captchaSecretKey: string;
  maintenanceMode: string;
  maintenanceMessage: string;
  registrationApproval: string;
  [key: string]: string;
}
