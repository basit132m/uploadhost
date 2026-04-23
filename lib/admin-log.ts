import { prisma } from "./db";

export async function logAdminAction(
  adminId: string,
  adminName: string,
  action: string,
  details?: string,
  ip?: string
): Promise<void> {
  await prisma.adminLog.create({
    data: { adminId, adminName, action, details, ip },
  });
}
