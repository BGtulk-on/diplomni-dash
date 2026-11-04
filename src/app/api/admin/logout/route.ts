import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminAuth } from "@/lib/adminAuth";

export async function GET() {
  const isAuthed = await verifyAdminAuth();
  return NextResponse.json({ authenticated: isAuthed });
}

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Излязохте успешно" });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
