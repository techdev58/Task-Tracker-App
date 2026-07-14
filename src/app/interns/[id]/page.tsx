"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api-client";
import { InternDTO, TaskProgressDTO, TaskProgressStatus, AttendanceDTO } from "@/lib/types";
import { getSubmissionInfo } from "@/lib/submission";
import { iconButtonClass } from "@/components/formStyles";

type ProgressPatch = { status?: TaskProgressStatus; completedAt?: string | null };

type Tab = "tasks" | "attendance";

function assignmentOf(p: TaskProgressDTO) {
  return typeof p.assignment === "string" ? null : p.assignment;
}

// Renders the tooltip with `position: fixed`, computed from the trigger's
// actual screen position on hover. A CSS `absolute` tooltip still expands
// its scrollable ancestor's scrollWidth even while invisible (its box is
// still in the layout) — inside this page's horizontally-scrolling table,
// that silently added a scrollbar. `fixed` positioning sits outside any
// ancestor's layout entirely, so it can't do that.
function HoverPreview({ text }: { text: string }) {
  const triggerRef = useRef<HTMLParagraphElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  function show() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.top, left: rect.left });
  }

  return (
    <>
      <p
        ref={triggerRef}
        className="truncate text-zinc-600 dark:text-zinc-400 cursor-default"
        onMouseEnter={show}
        onMouseLeave={() => setCoords(null)}
      >
        {text}
      </p>
      {coords && (
        <div
          className="fixed z-50 w-64 max-w-xs -translate-y-full rounded-lg bg-zinc-900 px-3 py-2 text-xs
                     leading-relaxed text-zinc-50 shadow-lg shadow-black/10 pointer-events-none
                     dark:bg-zinc-800 dark:ring-1 dark:ring-zinc-700"
          style={{ top: coords.top - 8, left: coords.left }}
        >
          {text}
          <div className="absolute left-4 top-full h-2 w-2 -translate-y-1 rotate-45 bg-zinc-900 dark:bg-zinc-800" />
        </div>
      )}
    </>
  );
}

function TaskProgressRow({ progress, onSave }: { progress: TaskProgressDTO; onSave: (id: string, patch: ProgressPatch) => Promise<void> }) {
  const assignment = assignmentOf(progress);
  const [status, setStatus] = useState<TaskProgressStatus>(progress.status);
  const [completedAt, setCompletedAt] = useState(progress.completedAt?.slice(0, 10) ?? "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleStatusChange(newStatus: TaskProgressStatus) {
    setStatus(newStatus);
    if (newStatus === "completed" && !completedAt) {
      setCompletedAt(new Date().toISOString().slice(0, 10));
    }
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(progress._id, {
        status,
        completedAt: status === "completed" ? completedAt : null,
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  const submission = getSubmissionInfo(status, completedAt ? new Date(completedAt).toISOString() : null, assignment?.dueDate ?? null);

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">{assignment?.task.title ?? "-"}</p>
        <p className="text-xs text-zinc-400">{assignment?.batch.name}</p>
      </td>
      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{assignment?.assignedDate?.slice(0, 10) ?? "-"}</td>
      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{assignment?.dueDate?.slice(0, 10) ?? "-"}</td>
      <td className="px-4 py-3">{assignment && <StatusBadge value={assignment.task.priority} />}</td>
      <td className="px-4 py-3">
        <select
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs px-2 py-1"
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as TaskProgressStatus)}
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <input
          type="date"
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs px-2 py-1 disabled:opacity-40"
          value={completedAt}
          disabled={status !== "completed"}
          onChange={(e) => { setCompletedAt(e.target.value); setDirty(true); }}
        />
      </td>
      <td className="px-4 py-3">
        {submission && (
          <div className="flex items-center gap-1.5">
            <StatusBadge value={submission.tag} />
            {submission.tag === "late" && (
              <span className="text-xs text-zinc-400">
                {submission.daysLate}d &middot; {Math.round(submission.credit * 100)}%
              </span>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3 max-w-[180px]">
        {progress.review ? <HoverPreview text={progress.review} /> : <span className="text-zinc-400">-</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <button className={iconButtonClass} onClick={handleSave} disabled={!dirty || saving} aria-label="Save">
          <Save size={16} />
        </button>
      </td>
    </tr>
  );
}

export default function InternDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [intern, setIntern] = useState<InternDTO | null>(null);
  const [progress, setProgress] = useState<TaskProgressDTO[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDTO[]>([]);
  const [tab, setTab] = useState<Tab>("tasks");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [internData, progressData, attendanceData] = await Promise.all([
        apiFetch<InternDTO>(`/api/interns/${id}`),
        apiFetch<TaskProgressDTO[]>(`/api/task-progress?intern=${id}`),
        apiFetch<AttendanceDTO[]>(`/api/attendance?intern=${id}`),
      ]);
      setIntern(internData);
      setProgress(progressData);
      setAttendance(attendanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load intern");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSaveProgress(progressId: string, patch: ProgressPatch) {
    const updated = await apiFetch<TaskProgressDTO>(`/api/task-progress/${progressId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    // The PATCH response doesn't repopulate `intern`/`assignment`, so merge in
    // just the changed fields rather than replacing the row (which would
    // clobber the already-populated task/batch info with bare ids).
    setProgress((prev) =>
      prev.map((p) =>
        p._id === progressId
          ? { ...p, status: updated.status, review: updated.review, completedAt: updated.completedAt }
          : p
      )
    );
  }

  if (loading) return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>;
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!intern) return null;

  const batchName = typeof intern.batch === "string" ? intern.batch : intern.batch?.name;

  const tabs: { key: Tab; label: string }[] = [
    { key: "tasks", label: `Tasks (${progress.length})` },
    { key: "attendance", label: `Attendance (${attendance.length})` },
  ];

  return (
    <div className="space-y-6">
      <Link href="/interns" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft size={16} /> Back to interns
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{intern.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{intern.email} &middot; {batchName}</p>
        </div>
        <StatusBadge value={intern.status} />
      </div>

      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key
                ? "border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tasks" && (
        <Card className="max-h-[65vh] overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-zinc-500 dark:text-zinc-400">
                <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Task / Batch</th>
                <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Assigned</th>
                <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Due</th>
                <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Priority</th>
                <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Status</th>
                <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Completed On</th>
                <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Submission</th>
                <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Review</th>
                <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 text-right font-medium dark:border-zinc-800 dark:bg-zinc-900">Save</th>
              </tr>
            </thead>
            <tbody>
              {progress.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-zinc-400">No tasks assigned yet. Assign one from the Daily Tasks page.</td></tr>
              )}
              {progress.map((p) => (
                <TaskProgressRow key={p._id} progress={p} onSave={handleSaveProgress} />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "attendance" && (
        <Card className="max-h-[65vh] overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-zinc-500 dark:text-zinc-400">
                <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Date</th>
                <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Status</th>
                <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-zinc-400">No attendance marked yet.</td></tr>}
              {attendance.map((a) => (
                <tr key={a._id} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{a.date.slice(0, 10)}</td>
                  <td className="px-4 py-3"><StatusBadge value={a.status} /></td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{a.remarks || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
