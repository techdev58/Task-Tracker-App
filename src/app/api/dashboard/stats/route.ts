import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth } from "date-fns";
import { connectToDatabase } from "@/lib/db";
import Batch from "@/lib/models/Batch";
import Intern from "@/lib/models/Intern";
import TaskProgress from "@/lib/models/TaskProgress";
import Attendance from "@/lib/models/Attendance";
import { getInternProgressReport } from "@/lib/progress";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    await connectToDatabase();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const now = new Date();

    const [
      totalBatches,
      activeBatches,
      totalInterns,
      activeInterns,
      statusCounts,
      todayAttendance,
      monthlyReport,
    ] = await Promise.all([
      Batch.countDocuments(),
      Batch.countDocuments({ status: "active" }),
      Intern.countDocuments(),
      Intern.countDocuments({ status: "active" }),
      TaskProgress.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Attendance.find({ date: { $gte: todayStart, $lte: todayEnd } }).populate("intern", "status"),
      getInternProgressReport({ start: startOfMonth(now), end: endOfMonth(now) }),
    ]);

    const statusMap = new Map(statusCounts.map((s) => [s._id, s.count]));
    const activeAttendanceToday = todayAttendance.filter((a) => {
      const intern = a.intern as unknown as { status?: string } | null;
      return intern?.status === "active";
    });
    const presentToday = activeAttendanceToday.filter((a) => a.status === "present").length;
    const attendanceRate = activeInterns > 0 ? Math.round((presentToday / activeInterns) * 100) : 0;

    const dangerZoneInterns = monthlyReport
      .filter((r) => r.zone === "danger")
      .sort((a, b) => (a.completionRate ?? 0) - (b.completionRate ?? 0));

    return NextResponse.json({
      totalBatches,
      activeBatches,
      totalInterns,
      activeInterns,
      pendingTasks: statusMap.get("pending") ?? 0,
      inProgressTasks: statusMap.get("in-progress") ?? 0,
      completedTasks: statusMap.get("completed") ?? 0,
      attendanceMarkedToday: todayAttendance.length,
      presentToday,
      attendanceRate,
      dangerZoneCount: dangerZoneInterns.length,
      dangerZoneInterns: dangerZoneInterns.slice(0, 5),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
