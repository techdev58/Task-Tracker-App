"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Star } from "lucide-react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api-client";
import { InternDTO, TaskDTO, TaskProgressDTO, TaskProgressStatus, AttendanceDTO, ReviewDTO } from "@/lib/types";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, iconButtonClass } from "@/components/formStyles";

type Tab = "tasks" | "attendance" | "reviews";

function assignmentOf(p: TaskProgressDTO) {
  return typeof p.assignment === "string" ? null : p.assignment;
}

function ReviewForm({ internId, catalogTasks, onSaved, onClose }: { internId: string; catalogTasks: TaskDTO[]; onSaved: () => void; onClose: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reviewerName, setReviewerName] = useState("Mentor");
  const [rating, setRating] = useState("5");
  const [comments, setComments] = useState("");
  const [task, setTask] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ intern: internId, task: task || undefined, date, reviewerName, rating, comments }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add Review" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Reviewer Name</label>
            <input className={inputClass} value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className={labelClass}>Related Task (optional)</label>
          <select className={inputClass} value={task} onChange={(e) => setTask(e.target.value)}>
            <option value="">None</option>
            {catalogTasks.map((t) => (
              <option key={t._id} value={t._id}>{t.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Rating (1-5)</label>
          <select className={inputClass} value={rating} onChange={(e) => setRating(e.target.value)}>
            {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Comments</label>
          <textarea className={inputClass} rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryButtonClass} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

function TaskProgressRow({ progress, onSave }: { progress: TaskProgressDTO; onSave: (id: string, patch: { status?: TaskProgressStatus; review?: string }) => Promise<void> }) {
  const assignment = assignmentOf(progress);
  const [status, setStatus] = useState<TaskProgressStatus>(progress.status);
  const [review, setReview] = useState(progress.review);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(progress._id, { status, review });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">{assignment?.task.title ?? "-"}</p>
        <p className="text-xs text-zinc-400">{assignment?.batch.name}</p>
      </td>
      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{assignment?.dueDate?.slice(0, 10) ?? "-"}</td>
      <td className="px-4 py-3">{assignment && <StatusBadge value={assignment.task.priority} />}</td>
      <td className="px-4 py-3">
        <select
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs px-2 py-1"
          value={status}
          onChange={(e) => { setStatus(e.target.value as TaskProgressStatus); setDirty(true); }}
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <input
          className={inputClass}
          placeholder="Review / progress note"
          value={review}
          onChange={(e) => { setReview(e.target.value); setDirty(true); }}
        />
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
  const [catalogTasks, setCatalogTasks] = useState<TaskDTO[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDTO[]>([]);
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [tab, setTab] = useState<Tab>("tasks");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [internData, progressData, taskData, attendanceData, reviewData] = await Promise.all([
        apiFetch<InternDTO>(`/api/interns/${id}`),
        apiFetch<TaskProgressDTO[]>(`/api/task-progress?intern=${id}`),
        apiFetch<TaskDTO[]>("/api/tasks"),
        apiFetch<AttendanceDTO[]>(`/api/attendance?intern=${id}`),
        apiFetch<ReviewDTO[]>(`/api/reviews?intern=${id}`),
      ]);
      setIntern(internData);
      setProgress(progressData);
      setCatalogTasks(taskData);
      setAttendance(attendanceData);
      setReviews(reviewData);
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

  async function handleSaveProgress(progressId: string, patch: { status?: TaskProgressStatus; review?: string }) {
    const updated = await apiFetch<TaskProgressDTO>(`/api/task-progress/${progressId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setProgress((prev) => prev.map((p) => (p._id === progressId ? updated : p)));
  }

  if (loading) return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>;
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!intern) return null;

  const batchName = typeof intern.batch === "string" ? intern.batch : intern.batch?.name;

  const tabs: { key: Tab; label: string }[] = [
    { key: "tasks", label: `Tasks (${progress.length})` },
    { key: "attendance", label: `Attendance (${attendance.length})` },
    { key: "reviews", label: `Reviews (${reviews.length})` },
  ];

  return (
    <div className="space-y-6">
      <Link href="/interns" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft size={16} /> Back to interns
      </Link>

      <div className="flex items-center justify-between">
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
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Task / Batch</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Review</th>
                <th className="px-4 py-3 font-medium text-right">Save</th>
              </tr>
            </thead>
            <tbody>
              {progress.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-400">No tasks assigned yet. Assign one from the Daily Tasks page.</td></tr>
              )}
              {progress.map((p) => (
                <TaskProgressRow key={p._id} progress={p} onSave={handleSaveProgress} />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "attendance" && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Remarks</th>
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

      {tab === "reviews" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className={primaryButtonClass} onClick={() => setShowReviewForm(true)}>
              <Plus size={16} /> Add Review
            </button>
          </div>
          <div className="space-y-3">
            {reviews.length === 0 && <Card className="p-6 text-center text-zinc-400 text-sm">No reviews yet.</Card>}
            {reviews.map((r) => (
              <Card key={r._id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{r.reviewerName}</p>
                    <p className="text-xs text-zinc-400">{r.date.slice(0, 10)}</p>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                {r.comments && <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">{r.comments}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {showReviewForm && (
        <ReviewForm internId={intern._id} catalogTasks={catalogTasks} onClose={() => setShowReviewForm(false)} onSaved={() => { setShowReviewForm(false); load(); }} />
      )}
    </div>
  );
}
