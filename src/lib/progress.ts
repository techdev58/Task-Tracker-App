import TaskAssignment from "@/lib/models/TaskAssignment";
import TaskProgress from "@/lib/models/TaskProgress";
import Intern from "@/lib/models/Intern";

export const DEFAULT_DANGER_THRESHOLD = 50;

export interface InternProgressReport {
  internId: string;
  internName: string;
  batchName: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number | null;
  zone: "safe" | "danger";
}

export async function getInternProgressReport({
  start,
  end,
  batch,
  threshold = DEFAULT_DANGER_THRESHOLD,
}: {
  start: Date;
  end: Date;
  batch?: string;
  threshold?: number;
}): Promise<InternProgressReport[]> {
  const assignmentFilter: Record<string, unknown> = { dueDate: { $gte: start, $lte: end } };
  if (batch) assignmentFilter.batch = batch;

  const assignmentIds = (await TaskAssignment.find(assignmentFilter).select("_id")).map((a) => a._id);

  const counts = await TaskProgress.aggregate([
    { $match: { assignment: { $in: assignmentIds } } },
    {
      $group: {
        _id: "$intern",
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
      },
    },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c]));

  const internFilter: Record<string, unknown> = { status: "active" };
  if (batch) internFilter.batch = batch;
  const interns = await Intern.find(internFilter).populate("batch", "name");

  return interns.map((intern) => {
    const counted = countMap.get(String(intern._id));
    const total = counted?.total ?? 0;
    const completed = counted?.completed ?? 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : null;
    const zone: "safe" | "danger" = completionRate !== null && completionRate < threshold ? "danger" : "safe";
    const batchName = typeof intern.batch === "object" && intern.batch && "name" in intern.batch
      ? (intern.batch as { name: string }).name
      : "";
    return {
      internId: String(intern._id),
      internName: intern.name,
      batchName,
      totalTasks: total,
      completedTasks: completed,
      completionRate,
      zone,
    };
  });
}
