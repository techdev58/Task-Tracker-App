"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Star, Trash2 } from "lucide-react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { apiFetch } from "@/lib/api-client";
import { InternDTO, ReviewDTO, TaskDTO } from "@/lib/types";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, iconButtonClass } from "@/components/formStyles";

function internName(v: ReviewDTO["intern"]) {
  return typeof v === "string" ? v : v.name;
}
function internId(v: ReviewDTO["intern"]) {
  return typeof v === "string" ? v : v._id;
}
function taskTitle(v?: ReviewDTO["task"]) {
  if (!v) return null;
  return typeof v === "string" ? v : v.title;
}

function ReviewForm({ interns, onSaved, onClose }: { interns: InternDTO[]; onSaved: () => void; onClose: () => void }) {
  const [intern, setIntern] = useState(interns[0]?._id ?? "");
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [task, setTask] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reviewerName, setReviewerName] = useState("Mentor");
  const [rating, setRating] = useState("5");
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!intern) return;
    apiFetch<TaskDTO[]>(`/api/tasks?intern=${intern}`).then(setTasks).catch(() => setTasks([]));
  }, [intern]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ intern, task: task || undefined, date, reviewerName, rating, comments }),
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
        <div>
          <label className={labelClass}>Intern</label>
          <select className={inputClass} value={intern} onChange={(e) => { setIntern(e.target.value); setTask(""); }} required>
            {interns.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
          </select>
        </div>
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
            {tasks.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
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
          <button type="submit" className={primaryButtonClass} disabled={saving || !intern}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [interns, setInterns] = useState<InternDTO[]>([]);
  const [internFilter, setInternFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (internFilter) params.set("intern", internFilter);
      const [reviewData, internData] = await Promise.all([
        apiFetch<ReviewDTO[]>(`/api/reviews?${params.toString()}`),
        apiFetch<InternDTO[]>("/api/interns"),
      ]);
      setReviews(reviewData);
      setInterns(internData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internFilter]);

  async function handleDelete(review: ReviewDTO) {
    if (!confirm("Delete this review?")) return;
    try {
      await apiFetch(`/api/reviews/${review._id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete review");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Reviews</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Mentor reviews and ratings for interns.</p>
        </div>
        <button className={primaryButtonClass} onClick={() => setShowForm(true)} disabled={interns.length === 0}>
          <Plus size={16} /> Add Review
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select className={`${inputClass} w-64`} value={internFilter} onChange={(e) => setInternFilter(e.target.value)}>
          <option value="">All interns</option>
          {interns.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
        </select>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="space-y-3">
        {loading && <p className="text-sm text-zinc-400">Loading...</p>}
        {!loading && reviews.length === 0 && <Card className="p-6 text-center text-zinc-400 text-sm">No reviews yet.</Card>}
        {reviews.map((r) => (
          <Card key={r._id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <Link href={`/interns/${internId(r.intern)}`} className="text-sm font-medium text-zinc-900 dark:text-zinc-50 hover:underline">
                  {internName(r.intern)}
                </Link>
                <p className="text-xs text-zinc-400">
                  {r.reviewerName} &middot; {r.date.slice(0, 10)}
                  {taskTitle(r.task) ? ` · Task: ${taskTitle(r.task)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} />
                  ))}
                </div>
                <button className={iconButtonClass} onClick={() => handleDelete(r)} aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {r.comments && <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">{r.comments}</p>}
          </Card>
        ))}
      </div>

      {showForm && (
        <ReviewForm interns={interns} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}
