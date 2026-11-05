import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbReady } from "@/lib/db";
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
    await ensureDbReady();
    const whereClause: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      if (status.includes(",")) {
        whereClause.status = { in: status.split(",") };   
      } else {
        whereClause.status = status;
      }
    }
    if (course && course !== "ALL") {
      whereClause.courseNumber = course;
    }

    if( search ){
      whereClause.OR = [
        { ticketNumber: { contains: search } },
        { fullName: { contains: search } },
        { email: { contains: search } },
        { ideaTitle: { contains: search } },
        { supervisor: { contains: search } },
      ] ;   
    }


    const [filtered, groupedStats] = await Promise.all([
      db.ticket.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      }),
      db.ticket.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]) ;   

    const countMap: Record<string, number> = {} ;
    let tot_cnt = 0 ;
    for( const grp of groupedStats ){
      const c_val = grp._count._all ;
      countMap[ grp.status ] = c_val ;   
      tot_cnt = tot_cnt+ c_val ;
    }


    const stats = {
      total: tot_cnt,
      pending: countMap["PENDING"] || 0,
      approved: countMap["APPROVED"] || 0,
      disapproved: countMap["DISAPPROVED"] || 0,
      inProgress: countMap["IN_PROGRESS"] || 0,
      completed: countMap["COMPLETED"] || 0,
    };

    return NextResponse.json({ success: true, tickets: filtered, stats });
  } catch (error) {
    console.error("Admin tickets fetch error:", error);
    return NextResponse.json({ error: "Грешка при зареждане на заявките" }, { status: 500 });
  }
}
