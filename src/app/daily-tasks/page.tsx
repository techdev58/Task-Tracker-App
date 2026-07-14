"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, ChevronRight, Trash2, Save, Pencil, CalendarDays, Clock, CheckCircle2 } from "lucide-react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api-client";
import { BatchDTO, TaskDTO, TaskAssignmentDTO, TaskProgressDTO, TaskProgressStatus } from "@/lib/types";
import { getSubmissionInfo } from "@/lib/submission";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, iconButtonClass } from "@/components/formStyles";

type ProgressPatch = { status?: TaskProgressStatus; review?: string; completedAt?: string | null };

function taskOf(a: TaskAssignmentDTO) {
  return typeof a.task === "string" ? { title: a.task } : a.task;
}
function batchOf(a: TaskAssignmentDTO) {
  return typeof a.batch === "string" ? { name: a.batch } : a.batch;
}

// Parsing "YYYY-MM-DD" with `new Date()` directly reads it as UTC and can
// shift a day in local timezones; build the Date from local parts instead.
function toLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(dateStr: string) {
  return toLocalDate(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type DueState = "completed" | "overdue" | "today" | "upcoming";

function getDueState(dueDate: string, completed: number, total: number): DueState {
  if (total > 0 && completed >= total) return "completed";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = toLocalDate(dueDate);
  if (due.getTime() < today.getTime()) return "overdue";
  if (due.getTime() === today.getTime()) return "today";
  return "upcoming";
}

const DUE_CHIP_CLASSES: Record<DueState, string> = {
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  overdue: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  today: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  upcoming: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

const DUE_LABEL: Record<DueState, string> = {
  completed: "Done",
  overdue: "Overdue",
  today: "Due today",
  upcoming: "Due",
};

function AssignmentForm({
  tasks,
  batches,
  onSaved,
  onClose,
}: {
  tasks: TaskDTO[];
  batches: BatchDTO[];
  onSaved: () => void;
  onClose: () => void;
}) {
  const [task, setTask] = useState(tasks[0]?._id ?? "");
  const [batch, setBatch] = useState(batches[0]?._id ?? "");
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/task-assignments", {
        method: "POST",
        body: JSON.stringify({ task, batch, assignedDate, dueDate }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Assign Task to Batch" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div>
          <label className={labelClass}>Task</label>
          <select className={inputClass} value={task} onChange={(e) => setTask(e.target.value)} required>
            {tasks.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Batch</label>
          <select className={inputClass} value={batch} onChange={(e) => setBatch(e.target.value)} required>
            {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Assigned Date</label>
            <input type="date" className={inputClass} value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Due Date</label>
            <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
        </div>
        <p className="text-xs text-zinc-400">
          This will assign the task to every active intern in the selected batch.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryButtonClass} disabled={saving || !task || !batch}>
            {saving ? "Assigning..." : "Assign"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditAssignmentForm({
  assignment,
  onSaved,
  onClose,
}: {
  assignment: TaskAssignmentDTO;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [assignedDate, setAssignedDate] = useState(assignment.assignedDate.slice(0, 10));
  const [dueDate, setDueDate] = useState(assignment.dueDate.slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const task = taskOf(assignment);
  const batch = batchOf(assignment);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/task-assignments/${assignment._id}`, {
        method: "PATCH",
        body: JSON.stringify({ assignedDate, dueDate }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update assignment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Assignment Dates" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {task.title} &middot; {batch.name}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Assigned Date</label>
            <input type="date" className={inputClass} value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Due Date</label>
            <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryButtonClass} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProgressRow({ progress, dueDate, onSave }: { progress: TaskProgressDTO; dueDate: string; onSave: (id: string, patch: ProgressPatch) => Promise<void> }) {
  const intern = typeof progress.intern === "string" ? { _id: progress.intern, name: progress.intern, email: "" } : progress.intern;
  const [status, setStatus] = useState<TaskProgressStatus>(progress.status);
  const [review, setReview] = useState(progress.review);
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
        review,
        completedAt: status === "completed" ? completedAt : null,
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  const submission = getSubmissionInfo(status, completedAt ? new Date(completedAt).toISOString() : null, dueDate);

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
      <td className="px-4 py-2">
        <Link href={`/interns/${intern._id}`} className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline">
          {intern.name}
        </Link>
      </td>
      <td className="px-4 py-2">
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
      <td className="px-4 py-2">
        <input
          type="date"
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs px-2 py-1 disabled:opacity-40"
          value={completedAt}
          disabled={status !== "completed"}
          onChange={(e) => { setCompletedAt(e.target.value); setDirty(true); }}
        />
      </td>
      <td className="px-4 py-2">
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
      <td className="px-4 py-2">
        <input
          className={inputClass}
          placeholder="Review / progress note"
          value={review}
          onChange={(e) => { setReview(e.target.value); setDirty(true); }}
        />
      </td>
      <td className="px-4 py-2 text-right">
        <button
          className={`${iconButtonClass} ${dirty ? "text-zinc-900 dark:text-zinc-50" : ""}`}
          onClick={handleSave}
          disabled={!dirty || saving}
          aria-label="Save"
        >
          <Save size={16} />
        </button>
      </td>
    </tr>
  );
}

function AssignmentCard({ assignment, onChanged }: { assignment: TaskAssignmentDTO; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState<TaskProgressDTO[] | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const fetchStarted = useRef(false);

  function toggleExpand() {
    // Always flip immediately (no waiting on the fetch), and use a ref
    // rather than state to guard the one-time fetch — a ref update can't
    // race a click the way the old `await`-then-toggle flow could, which
    // is why the expand/collapse used to feel unreliable.
    setExpanded((e) => !e);
    if (!fetchStarted.current) {
      fetchStarted.current = true;
      setLoadingProgress(true);
      apiFetch<{ progress: TaskProgressDTO[] }>(`/api/task-assignments/${assignment._id}`)
        .then((data) => setProgress(data.progress))
        .finally(() => setLoadingProgress(false));
    }
  }

  async function handleSaveProgress(id: string, patch: ProgressPatch) {
    const updated = await apiFetch<TaskProgressDTO>(`/api/task-progress/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    // The PATCH response doesn't repopulate `intern`, so merge in just the
    // changed fields rather than replacing the row (which would clobber the
    // already-populated intern name with its bare id).
    setProgress((prev) =>
      prev?.map((p) =>
        p._id === id
          ? { ...p, status: updated.status, review: updated.review, completedAt: updated.completedAt }
          : p
      ) ?? null
    );
  }

  async function handleDelete() {
    if (!confirm("Remove this assignment and all intern progress tied to it?")) return;
    await apiFetch(`/api/task-assignments/${assignment._id}`, { method: "DELETE" });
    onChanged();
  }

  const task = taskOf(assignment);
  const batch = batchOf(assignment);
  const total = assignment.totalInterns ?? 0;
  const completed = assignment.completedCount ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const dueState = getDueState(assignment.dueDate, completed, total);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            className="shrink-0 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            onClick={toggleExpand}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse intern progress" : "Expand intern progress"}
          >
            <ChevronRight size={18} className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
          </button>
          <button className="min-w-0 flex-1 text-left" onClick={toggleExpand}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-zinc-900 dark:text-zinc-50 truncate">{task.title}</p>
              <span className="inline-flex shrink-0 items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {batch.name}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                <CalendarDays size={13} className="shrink-0" /> Assigned {formatDate(assignment.assignedDate)}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${DUE_CHIP_CLASSES[dueState]}`}>
                {dueState === "completed" ? <CheckCircle2 size={13} className="shrink-0" /> : <Clock size={13} className="shrink-0" />}
                {DUE_LABEL[dueState]} {formatDate(assignment.dueDate)}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <span
                    className={`block h-full rounded-full ${pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{completed}/{total} completed</span>
              </span>
            </div>
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button className={iconButtonClass} onClick={() => setShowEditForm(true)} aria-label="Edit assignment dates">
            <Pencil size={16} />
          </button>
          <button className={iconButtonClass} onClick={handleDelete} aria-label="Delete assignment">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="max-h-72 overflow-auto border-t border-zinc-200 dark:border-zinc-800">
          {loadingProgress && <p className="px-4 py-4 text-sm text-zinc-400">Loading interns...</p>}
          {!loadingProgress && progress && progress.length === 0 && (
            <p className="px-4 py-4 text-sm text-zinc-400">No active interns in this batch.</p>
          )}
          {!loadingProgress && progress && progress.length > 0 && (
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-zinc-500 dark:text-zinc-400">
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 font-medium dark:bg-zinc-900">Intern</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 font-medium dark:bg-zinc-900">Status</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 font-medium dark:bg-zinc-900">Completed On</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 font-medium dark:bg-zinc-900">Submission</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 font-medium dark:bg-zinc-900">Review</th>
                  <th className="sticky top-0 z-10 bg-white px-4 py-2 text-right font-medium dark:bg-zinc-900">Save</th>
                </tr>
              </thead>
              <tbody>
                {progress.map((p) => (
                  <ProgressRow key={p._id} progress={p} dueDate={assignment.dueDate} onSave={handleSaveProgress} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showEditForm && (
        <EditAssignmentForm
          assignment={assignment}
          onClose={() => setShowEditForm(false)}
          onSaved={() => { setShowEditForm(false); onChanged(); }}
        />
      )}
    </Card>
  );
}

export default function DailyTasksPage() {
  const [assignments, setAssignments] = useState<TaskAssignmentDTO[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [batches, setBatches] = useState<BatchDTO[]>([]);
  const [batchFilter, setBatchFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (batchFilter) params.set("batch", batchFilter);
      const [assignmentData, taskData, batchData] = await Promise.all([
        apiFetch<TaskAssignmentDTO[]>(`/api/task-assignments?${params.toString()}`),
        apiFetch<TaskDTO[]>("/api/tasks"),
        apiFetch<BatchDTO[]>("/api/batches"),
      ]);
      setAssignments(assignmentData);
      setTasks(taskData);
      setBatches(batchData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load daily tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Daily Tasks</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Assign a catalog task to a whole batch and track each intern&apos;s daily progress.
          </p>
        </div>
        <button className={primaryButtonClass} onClick={() => setShowForm(true)} disabled={tasks.length === 0 || batches.length === 0}>
          <Plus size={16} /> Assign Task to Batch
        </button>
      </div>

      {(tasks.length === 0 || batches.length === 0) && !loading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Create at least one task (Tasks tab) and one batch before assigning.
        </p>
      )}

      <div className="flex items-center gap-3">
        <select className={`${inputClass} w-full sm:w-64`} value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
          <option value="">All batches</option>
          {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="space-y-3">
        {loading && <p className="text-sm text-zinc-400">Loading...</p>}
        {!loading && assignments.length === 0 && (
          <Card className="p-6 text-center text-zinc-400 text-sm">No tasks assigned to any batch yet.</Card>
        )}
        {assignments.map((a) => (
          <AssignmentCard key={a._id} assignment={a} onChanged={load} />
        ))}
      </div>

      {showForm && (
        <AssignmentForm tasks={tasks} batches={batches} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}
