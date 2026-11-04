import { cookies, headers } from "next/headers";
import crypto from "node:crypto";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "uktc2026admin";
const COOKIE_NAME = "uktc_admin_session";

function hashSecret(secret: string): string {
  return crypto.createHash("sha256").update(`${secret}_uktc_salt_2026`).digest("hex");
}

export async function verifyAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  let sessionToken = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionToken) {
    const reqHeaders = await headers();
    const authHeader = reqHeaders.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      sessionToken = authHeader.substring(7).trim();
    } else {
      sessionToken = reqHeaders.get("x-admin-token") || undefined;
    }
  }

  if (!sessionToken) return false;

  const validToken = hashSecret(ADMIN_SECRET);
  return sessionToken === validToken;
}

export function generateAdminToken(enteredSecret: string): string | null {
  if (enteredSecret.trim() === ADMIN_SECRET.trim()) {
    return hashSecret(ADMIN_SECRET);
  }
  return null;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
