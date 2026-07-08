import TaskAssignment from "@/lib/models/TaskAssignment";
import TaskProgress from "@/lib/models/TaskProgress";
import Intern from "@/lib/models/Intern";
import { getSubmissionInfo } from "@/lib/submission";

export const DEFAULT_DANGER_THRESHOLD = 50;

export interface InternProgressReport {
  internId: string;
  internName: string;
  batchName: string;
  totalTasks: number;
  completedTasks: number;
  onTimeTasks: number;
  lateTasks: number;
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

  const assignments = await TaskAssignment.find(assignmentFilter).select("_id dueDate");
  const dueDateMap = new Map(assignments.map((a) => [String(a._id), a.dueDate]));
  const assignmentIds = assignments.map((a) => a._id);

  const progressRows = await TaskProgress.find({ assignment: { $in: assignmentIds } }).select(
    "intern assignment status completedAt"
  );

  const perIntern = new Map<string, { total: number; onTime: number; late: number; credit: number }>();
  for (const row of progressRows) {
    const key = String(row.intern);
    const entry = perIntern.get(key) ?? { total: 0, onTime: 0, late: 0, credit: 0 };
    entry.total += 1;
    const dueDate = dueDateMap.get(String(row.assignment));
    const info = getSubmissionInfo(row.status, row.completedAt, dueDate);
    if (info) {
      entry.credit += info.credit;
      if (info.tag === "late") entry.late += 1;
      else entry.onTime += 1;
    }
    perIntern.set(key, entry);
  }

  const internFilter: Record<string, unknown> = { status: "active" };
  if (batch) internFilter.batch = batch;
  const interns = await Intern.find(internFilter).populate("batch", "name");

  return interns.map((intern) => {
    const counted = perIntern.get(String(intern._id));
    const total = counted?.total ?? 0;
    const onTime = counted?.onTime ?? 0;
    const late = counted?.late ?? 0;
    const credit = counted?.credit ?? 0;
    const completionRate = total > 0 ? Math.round((credit / total) * 100) : null;
    const zone: "safe" | "danger" = completionRate !== null && completionRate < threshold ? "danger" : "safe";
    const batchName = typeof intern.batch === "object" && intern.batch && "name" in intern.batch
      ? (intern.batch as { name: string }).name
      : "";
    return {
      internId: String(intern._id),
      internName: intern.name,
      batchName,
      totalTasks: total,
      completedTasks: onTime + late,
      onTimeTasks: onTime,
      lateTasks: late,
      completionRate,
      zone,
    };
  });
}
