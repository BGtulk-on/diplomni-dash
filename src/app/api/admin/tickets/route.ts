import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const isAuthed = await verifyAdminAuth();
  if (!isAuthed) {
    return NextResponse.json({ error: "Нямате оторизация за достъп" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim();
  const course = searchParams.get("course")?.trim();
  const search = searchParams.get("search")?.trim().toLowerCase();

  try {
    const whereClause: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      whereClause.status = status;
    }
    if (course && course !== "ALL") {
      whereClause.courseNumber = course;
    }

    const tickets = await db.ticket.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // In-memory text filter for search query across multiple fields
    const filtered = search
      ? tickets.filter(
          (t) =>
            t.ticketNumber.toLowerCase().includes(search) ||
            t.fullName.toLowerCase().includes(search) ||
            t.email.toLowerCase().includes(search) ||
            t.ideaTitle.toLowerCase().includes(search) ||
            t.supervisor.toLowerCase().includes(search)
        )
      : tickets;

    // Global stats count across all tickets in the database (independent of active filter)
    const allTickets = await db.ticket.findMany({
      select: { status: true },
    });

    const stats = {
      total: allTickets.length,
      pending: allTickets.filter((t) => t.status === "PENDING").length,
      approved: allTickets.filter((t) => t.status === "APPROVED").length,
      disapproved: allTickets.filter((t) => t.status === "DISAPPROVED").length,
      inProgress: allTickets.filter((t) => t.status === "IN_PROGRESS").length,
      completed: allTickets.filter((t) => t.status === "COMPLETED").length,
    };

    return NextResponse.json({ success: true, tickets: filtered, stats });
  } catch (error) {
    console.error("Admin tickets fetch error:", error);
    return NextResponse.json({ error: "Грешка при зареждане на заявките" }, { status: 500 });
  }
}
