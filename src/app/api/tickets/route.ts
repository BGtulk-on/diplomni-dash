import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbReady } from "@/lib/db";
import { TicketSubmissionSchema, checkRateLimit, sanitizeText } from "@/lib/security";
import { sendTicketConfirmationEmail } from "@/lib/email";
import crypto from "node:crypto";

function generateTicketNumber(): string {
  const randomSuffix = crypto.randomInt(1000, 9999).toString();
  return `UKTC-2026-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  const { allowed } = checkRateLimit(`ticket-sub:${ip}`, 8, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Превишен лимит на изпращане. Моля, изчакайте няколко минути." },
      { status: 429 }
    );
  }

  try {
    await ensureDbReady();
    const rawData = await req.json();

    if (rawData.website_trap && String(rawData.website_trap).length > 0) {
      return NextResponse.json({ error: "Невалидна заявка (бот филтър)" }, { status: 400 });
    }

    const validation = TicketSubmissionSchema.safeParse(rawData);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0]?.message || "Невалидни данни във формата";
      return NextResponse.json({ error: firstError, details: validation.error.format() }, { status: 400 });
    }

    const val = validation.data;
    const cleanCourseNumber = val.courseNumber.toLowerCase().trim();

    const derivedEmail = `${cleanCourseNumber}@uktc-bg.com`;

    let ticketNumber = generateTicketNumber();
    let collision = await db.ticket.findUnique({ where: { ticketNumber } });
    let attempts = 0;
    while (collision && attempts < 5) {
      ticketNumber = generateTicketNumber();
      collision = await db.ticket.findUnique({ where: { ticketNumber } });
      attempts++;
    }

    const newTicket = await db.ticket.create({
      data: {
        ticketNumber,
        fullName: sanitizeText(val.fullName),
        email: derivedEmail,
        phone: null,
        courseNumber: cleanCourseNumber.toUpperCase(),
        commPlatform: sanitizeText(val.commPlatform),
        commHandle: sanitizeText(val.commHandle),
        hasCustomIdea: val.hasCustomIdea,
        ideaTitle: sanitizeText(val.ideaTitle),
        presetTheme: val.presetTheme ? sanitizeText(val.presetTheme) : null,
        ideaDescription: val.ideaDescription ? sanitizeText(val.ideaDescription) : null,
        supervisor: sanitizeText(val.supervisor),
        scope: val.scope,
        difficulty: val.difficulty,
        includeCodeComments: val.includeCodeComments ?? false,
        offeredBudget: val.offeredBudget,
        additionalNotes: val.additionalNotes ? sanitizeText(val.additionalNotes) : null,
        status: "PENDING",
      },
    });

    let emailResult = null;
    try {
      emailResult = await sendTicketConfirmationEmail({
        to: newTicket.email,
        fullName: newTicket.fullName,
        ticketNumber: newTicket.ticketNumber,
        courseNumber: newTicket.courseNumber,
        ideaTitle: newTicket.ideaTitle,
        difficulty: newTicket.difficulty,
        scope: newTicket.scope,
        budget: newTicket.offeredBudget,
        includeCodeComments: newTicket.includeCodeComments,
      });
      console.log(`[Ticket Created] ${newTicket.ticketNumber} | Email result:`, emailResult);
    } catch (err) {
      console.error("[Ticket Created] Resend dispatch error:", err);
    }

    return NextResponse.json({
      success: true,
      ticketNumber: newTicket.ticketNumber,
      ticket: {
        id: newTicket.id,
        ticketNumber: newTicket.ticketNumber,
        fullName: newTicket.fullName,
        email: newTicket.email,
        courseNumber: newTicket.courseNumber,
        ideaTitle: newTicket.ideaTitle,
        status: newTicket.status,
        createdAt: newTicket.createdAt,
      },
    });
  } catch (error) {
    console.error("Ticket submission API error:", error);
    return NextResponse.json({ error: "Възникна системна грешка при обработка на заявката." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticketNumber = searchParams.get("ticketNumber")?.trim();

  if (!ticketNumber) {
    return NextResponse.json({ error: "Моля, въведете номер на тикет" }, { status: 400 });
  }

  try {
    await ensureDbReady();
    const ticket = await db.ticket.findUnique({
      where: { ticketNumber },
      select: {
        ticketNumber: true,
        courseNumber: true,
        ideaTitle: true,
        status: true,
        scope: true,
        difficulty: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Не е намерена заявка с този номер" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("Ticket lookup error:", error);
    return NextResponse.json({ error: "Грешка при проверка на тикет" }, { status: 500 });
  }
}
