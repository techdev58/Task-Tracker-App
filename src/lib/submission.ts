import { SubmissionTag } from "@/lib/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface SubmissionInfo {
  tag: SubmissionTag;
  daysLate: number;
  /** 1 = full credit (on time), 1/2 for 1 day late, 1/3 for 2 days late, etc. */
  credit: number;
}

/**
 * Credit decays as 1 / (daysLate + 1): on time = 100%, 1 day late = 50%,
 * 2 days late = 33%, 3 days late = 25%, and so on.
 */
export function getSubmissionInfo(
  status: string,
  completedAt: string | Date | null | undefined,
  dueDate: string | Date | null | undefined
): SubmissionInfo | null {
  if (status !== "completed" || !completedAt || !dueDate) return null;
  const daysLate = Math.max(0, Math.round((new Date(completedAt).getTime() - new Date(dueDate).getTime()) / MS_PER_DAY));
  return {
    tag: daysLate > 0 ? "late" : "on-time",
    daysLate,
    credit: 1 / (daysLate + 1),
  };
}
