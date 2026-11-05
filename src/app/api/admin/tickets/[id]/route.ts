import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbReady } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/adminAuth";
import { sendTicketStatusEmail } from "@/lib/email";
import { AdminTicketPatchSchema, AdminEmailActionSchema, sanitizeText } from "@/lib/security";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const isAuthed = await verifyAdminAuth();
  if (!isAuthed) {
    return NextResponse.json({ error: "Нямате оторизация за достъп" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await ensureDbReady();
    const rawBody = await req.json();
    const parsed = AdminTicketPatchSchema.safeParse( rawBody ) ;   
    if( !parsed.success ){
      return NextResponse.json({ error: "Невалидни данни за обновяване" }, { status: 400 }) ;
    }

    const { status, adminNotes } = parsed.data ;


    const dataToUpdate: Record<string, unknown> = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (adminNotes !== undefined) {
      dataToUpdate.adminNotes = adminNotes ? sanitizeText( adminNotes ) : null ;   
    }

    const updated = await db.ticket.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error("Admin ticket update error:", error);
    return NextResponse.json({ error: "Грешка при обновяване на тикет" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const isAuthed = await verifyAdminAuth();
  if (!isAuthed) {
    return NextResponse.json({ error: "Нямате оторизация за достъп" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await ensureDbReady();
    const rawBody = await req.json();
    const parsed = AdminEmailActionSchema.safeParse( rawBody ) ;
    if( !parsed.success ){
      return NextResponse.json({ error: "Невалидни параметри за имейл" }, { status: 400 }) ;   
    }

    const { action, customSubject, customMessage } = parsed.data ;

    const ticket = await db.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: "Тикетът не е намерен" }, { status: 404 });
    }

    let emailStatus: "APPROVED" | "DISAPPROVED" | "CUSTOM" = "CUSTOM";
    let newTicketStatus = ticket.status;

    if (action === "APPROVE_EMAIL") {
      emailStatus = "APPROVED";
      newTicketStatus = "APPROVED";
    } else if (action === "DISAPPROVE_EMAIL") {
      emailStatus = "DISAPPROVED";
      newTicketStatus = "DISAPPROVED";
    }

    const result = await sendTicketStatusEmail({
      to: ticket.email,
      fullName: ticket.fullName,
      ticketNumber: ticket.ticketNumber,
      status: emailStatus,
      subject: customSubject,
      customMessage: customMessage,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Грешка при изпращане на имейла през Resend" },
        { status: 500 }
      );
    }

    const updatedTicket = await db.ticket.update({
      where: { id },
      data: { status: newTicketStatus },
    });

    const baseMessage =
      action === "APPROVE_EMAIL"
        ? "Имейл за одобрение бе изпратен успешно!"
        : action === "DISAPPROVE_EMAIL"
        ? "Имейл за отказ бе изпратен успешно!"
        : "Персонализираният имейл бе изпратен успешно!";

    const finalMessage = result.fallbackUsed
      ? `${baseMessage} (Тест: доставен на ${result.deliveredTo})`
      : baseMessage;

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      emailResult: result,
      message: finalMessage,
    });
  } catch (error) {
    console.error("Admin ticket action error:", error);
    return NextResponse.json({ error: "Грешка при изпълнение на действието" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const isAuthed = await verifyAdminAuth();
  if (!isAuthed) {
    return NextResponse.json({ error: "Нямате оторизация за достъп" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await ensureDbReady();
    await db.ticket.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Заявката бе изтрита" });
  } catch (error) {
    console.error("Admin ticket delete error:", error);
    return NextResponse.json({ error: "Грешка при изтриване" }, { status: 500 });
  }
}
