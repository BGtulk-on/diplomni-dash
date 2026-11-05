import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  schemaInit: boolean | undefined;
};

function resolveDbUrl(): string {
  const raw = ( process.env.DATABASE_URL || "" ).replace(/^["']|["']$/g, "").trim() ;   
  if (raw.startsWith("libsql://") || raw.startsWith("https://") || raw.startsWith("http://")) {
    return raw;
  }
  if (process.env.VERCEL) {
    return "file:/tmp/dev.db";
  }
  return `file:${path.resolve(process.cwd(), "dev.db")}`;
}

function getPrismaClient(): PrismaClient {
  const dbUrl = resolveDbUrl();
  const authTok = ( process.env.TURSO_AUTH_TOKEN || "" ).replace(/^["']|["']$/g, "").trim() || undefined ;   
  const adapter = new PrismaLibSql({ url: dbUrl, authToken: authTok });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export async function ensureDbReady() {
  if (globalForPrisma.schemaInit) return;
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Ticket" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "ticketNumber" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "courseNumber" TEXT NOT NULL,
        "commPlatform" TEXT NOT NULL,
        "commHandle" TEXT NOT NULL,
        "hasCustomIdea" BOOLEAN NOT NULL DEFAULT true,
        "ideaTitle" TEXT NOT NULL,
        "presetTheme" TEXT,
        "ideaDescription" TEXT,
        "supervisor" TEXT NOT NULL,
        "scope" TEXT NOT NULL DEFAULT 'FULL_PACKAGE',
        "difficulty" TEXT NOT NULL DEFAULT 'STANDARD',
        "includeCodeComments" BOOLEAN NOT NULL DEFAULT false,
        "offeredBudget" INTEGER NOT NULL,
        "additionalNotes" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "adminNotes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
    await db.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber")`
    );
    globalForPrisma.schemaInit = true;
  } catch (err) {
    console.error("Schema init warning:", err);
  }
}

