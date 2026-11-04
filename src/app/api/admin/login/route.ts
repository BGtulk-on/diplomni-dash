import { NextRequest, NextResponse } from "next/server";
import { generateAdminToken, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import { checkRateLimit } from "@/lib/security";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const { allowed } = checkRateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);

  if (!allowed) {
    return NextResponse.json(
      { error: "Твърде много неуспешни опити. Моля, изчакайте 15 минути." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const pin = body.pin;

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "Въведете администраторски PIN код" }, { status: 400 });
    }

    const token = generateAdminToken(pin);
    if (!token) {
      return NextResponse.json({ error: "Невалиден PIN код за достъп" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, token, message: "Успешна автентикация" });
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Възникна системна грешка при вход" }, { status: 500 });
  }
}
