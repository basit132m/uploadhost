import { PrismaClient } from "@prisma/client";

function getDatabaseUrl(): string {
  // Use individual vars if provided (avoids URL encoding issues with special chars)
  if (process.env.DB_HOST) {
    const pass = encodeURIComponent(process.env.DB_PASS ?? "");
    const user = process.env.DB_USER ?? "";
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT ?? "3306";
    const name = process.env.DB_NAME ?? "";
    return `mysql://${user}:${pass}@${host}:${port}/${name}`;
  }
  return process.env.DATABASE_URL ?? "";
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: { db: { url: getDatabaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
