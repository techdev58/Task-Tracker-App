import { NextResponse } from "next/server";
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
      activeBatchDocs,
      totalInterns,
      activeInterns,
      statusCounts,
      todayAttendance,
    ] = await Promise.all([
      Batch.countDocuments(),
      Batch.find({ status: "active" }).sort({ name: 1 }),
      Intern.countDocuments(),
      Intern.countDocuments({ status: "active" }),
      TaskProgress.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Attendance.find({ date: { $gte: todayStart, $lte: todayEnd } }).populate("intern", "status"),
    ]);

    const statusMap = new Map(statusCounts.map((s) => [s._id, s.count]));
    const activeAttendanceToday = todayAttendance.filter((a) => {
      const intern = a.intern as unknown as { status?: string } | null;
      return intern?.status === "active";
    });
    const presentToday = activeAttendanceToday.filter((a) => a.status === "present").length;
    const attendanceRate = activeInterns > 0 ? Math.round((presentToday / activeInterns) * 100) : 0;

    const batchProgress = await Promise.all(
      activeBatchDocs.map(async (batch) => {
        // No user-facing filter on the dashboard: show each batch's overall
        // progress from when it started up to today.
        const report = await getInternProgressReport({
          start: batch.startDate,
          end: now,
          batch: String(batch._id),
        });
        const withTasks = report.filter((r) => r.completionRate !== null);
        const avgCompletionRate =
          withTasks.length > 0
            ? Math.round(withTasks.reduce((sum, r) => sum + (r.completionRate ?? 0), 0) / withTasks.length)
            : null;
        const dangerZoneInterns = report
          .filter((r) => r.zone === "danger")
          .sort((a, b) => (a.completionRate ?? 0) - (b.completionRate ?? 0));

        return {
          batchId: String(batch._id),
          batchName: batch.name,
          activeInterns: report.length,
          avgCompletionRate,
          dangerZoneCount: dangerZoneInterns.length,
          dangerZoneInterns: dangerZoneInterns.slice(0, 5),
        };
      })
    );

    const dangerZoneCount = batchProgress.reduce((sum, b) => sum + b.dangerZoneCount, 0);

    return NextResponse.json({
      totalBatches,
      activeBatches: activeBatchDocs.length,
      totalInterns,
      activeInterns,
      pendingTasks: statusMap.get("pending") ?? 0,
      inProgressTasks: statusMap.get("in-progress") ?? 0,
      completedTasks: statusMap.get("completed") ?? 0,
      attendanceMarkedToday: todayAttendance.length,
      presentToday,
      attendanceRate,
      dangerZoneCount,
      batchProgress,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
