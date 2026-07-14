export type BatchStatus = "active" | "completed";
export type InternStatus = "active" | "completed" | "dropped";
export type TaskProgressStatus = "pending" | "in-progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type AttendanceStatus = "present" | "absent" | "leave" | "half-day";
export type Zone = "safe" | "danger";
export type SubmissionTag = "on-time" | "late";

export interface BatchDTO {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: BatchStatus;
  internCount?: number;
}

export interface InternDTO {
  _id: string;
  name: string;
  email: string;
  phone: string;
  batch: { _id: string; name: string } | string;
  joinDate: string;
  status: InternStatus;
}

export interface TaskDTO {
  _id: string;
  title: string;
  description: string;
  priority: TaskPriority;
}

export interface TaskAssignmentDTO {
  _id: string;
  task: { _id: string; title: string; description: string; priority: TaskPriority } | string;
  batch: { _id: string; name: string } | string;
  dueDate: string;
  assignedDate: string;
  totalInterns?: number;
  completedCount?: number;
}

export interface TaskProgressDTO {
  _id: string;
  assignment:
    | {
        _id: string;
        task: { _id: string; title: string; description: string; priority: TaskPriority };
        batch: { _id: string; name: string };
        dueDate: string;
        assignedDate: string;
      }
    | string;
  intern: { _id: string; name: string; email: string } | string;
  status: TaskProgressStatus;
  review: string;
  completedAt: string | null;
}

export interface AttendanceDTO {
  _id: string;
  intern: { _id: string; name: string; email: string; batch?: { _id: string; name: string } } | string;
  date: string;
  status: AttendanceStatus;
  remarks: string;
}

export interface InternProgressReportDTO {
  internId: string;
  internName: string;
  batchName: string;
  totalTasks: number;
  completedTasks: number;
  onTimeTasks: number;
  lateTasks: number;
  completionRate: number | null;
  zone: Zone;
}

export interface ProgressReportResponse {
  months: number;
  start: string;
  end: string;
  threshold: number;
  interns: InternProgressReportDTO[];
}

export interface BatchProgressSummary {
  batchId: string;
  batchName: string;
  activeInterns: number;
  avgCompletionRate: number | null;
  dangerZoneCount: number;
  dangerZoneInterns: InternProgressReportDTO[];
}

export interface DashboardStats {
  totalBatches: number;
  activeBatches: number;
  totalInterns: number;
  activeInterns: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  attendanceMarkedToday: number;
  presentToday: number;
  attendanceRate: number;
  dangerZoneCount: number;
  batchProgress: BatchProgressSummary[];
}
