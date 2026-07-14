"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Pencil, Save, X, MessageSquareText } from "lucide-react";
import Card from "@/components/Card";
import Select from "@/components/Select";
import StatusBadge from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api-client";
import { getSubmissionInfo } from "@/lib/submission";
import { BatchDTO, InternDTO, TaskProgressDTO } from "@/lib/types";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, iconButtonClass } from "@/components/formStyles";

function assignmentOf(p: TaskProgressDTO) {
  return typeof p.assignment === "string" ? null : p.assignment;
}
function internOf(p: TaskProgressDTO) {
  return typeof p.intern === "string" ? { _id: p.intern, name: p.intern, email: "" } : p.intern;
}
function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function ReviewCard({ progress, onSave }: { progress: TaskProgressDTO; onSave: (id: string, review: string) => Promise<void> }) {
  const assignment = assignmentOf(progress);
  const intern = internOf(progress);
  const [editing, setEditing] = useState(false);
  const [review, setReview] = useState(progress.review);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(progress._id, review);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setReview(progress.review);
    setEditing(false);
  }

  const submission = getSubmissionInfo(progress.status, progress.completedAt, assignment?.dueDate ?? null);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          {initialsOf(intern.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Link href={`/interns/${intern._id}`} className="shrink-0 font-medium text-zinc-900 dark:text-zinc-50 hover:underline">
                {intern.name}
              </Link>
              <div className="flex min-w-0 items-center gap-1.5 text-xs">
                <span className="truncate font-medium text-zinc-600 dark:text-zinc-300">
                  {assignment?.task.title ?? "-"}
                </span>
                {assignment?.batch.name && (
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {assignment.batch.name}
                  </span>
                )}
                {assignment?.dueDate && (
                  <span className="shrink-0 text-zinc-400">Due {assignment.dueDate.slice(0, 10)}</span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <StatusBadge value={progress.status} />
              {submission && <StatusBadge value={submission.tag} />}
            </div>
          </div>

          {editing ? (
            <div className="mt-3 space-y-2">
              <textarea
                autoFocus
                className={inputClass}
                rows={3}
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button className={secondaryButtonClass} onClick={handleCancel} disabled={saving}>
                  <X size={14} /> Cancel
                </button>
                <button className={primaryButtonClass} onClick={handleSave} disabled={saving}>
                  <Save size={14} /> {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2.5 flex items-start justify-between gap-3">
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{progress.review}</p>
              <button className={`${iconButtonClass} shrink-0`} onClick={() => setEditing(true)} aria-label="Edit review">
                <Pencil size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function ReviewsPage() {
  const [progress, setProgress] = useState<TaskProgressDTO[]>([]);
  const [interns, setInterns] = useState<InternDTO[]>([]);
  const [batches, setBatches] = useState<BatchDTO[]>([]);
  const [internFilter, setInternFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<InternDTO[]>("/api/interns").then(setInterns).catch(() => setInterns([]));
    apiFetch<BatchDTO[]>("/api/batches").then(setBatches).catch(() => setBatches([]));
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ hasReview: "true" });
      if (internFilter) params.set("intern", internFilter);
      if (batchFilter) params.set("batch", batchFilter);
      const data = await apiFetch<TaskProgressDTO[]>(`/api/task-progress?${params.toString()}`);
      setProgress(data);
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
  }, [internFilter, batchFilter]);

  async function handleSave(id: string, review: string) {
    const updated = await apiFetch<TaskProgressDTO>(`/api/task-progress/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ review }),
    });
    // Merge in the changed field only: the PATCH response doesn't repopulate
    // intern/assignment, so replacing the whole row would clobber those.
    setProgress((prev) => prev.map((p) => (p._id === id ? { ...p, review: updated.review } : p)));
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return progress;
    return progress.filter((p) => {
      const assignment = assignmentOf(p);
      const intern = internOf(p);
      const haystack = [intern.name, assignment?.task.title, assignment?.batch.name, p.review]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [progress, search]);

  const hasActiveFilters = Boolean(internFilter || batchFilter || search);

  function clearFilters() {
    setInternFilter("");
    setBatchFilter("");
    setSearch("");
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Reviews</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Every review note written on a task, in one place. Add or edit a review here or from
          the Daily Tasks tab — both edit the same note.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[220px] flex-1">
            <label className={labelClass}>Search</label>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                className={`${inputClass} pl-9`}
                placeholder="Search by intern, task, or review text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <label className={labelClass}>Intern</label>
            <Select className="w-full sm:w-48" value={internFilter} onChange={(e) => setInternFilter(e.target.value)}>
              <option value="">All interns</option>
              {interns.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
            </Select>
          </div>
          <div className="w-full sm:w-auto">
            <label className={labelClass}>Batch</label>
            <Select className="w-full sm:w-48" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
              <option value="">All batches</option>
              {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </Select>
          </div>
          {hasActiveFilters && (
            <button className={secondaryButtonClass} onClick={clearFilters}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </Card>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!loading && progress.length > 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {filtered.length} review{filtered.length === 1 ? "" : "s"}
        </p>
      )}

      <Card className="min-h-0 space-y-2 overflow-auto p-3">
        {loading && <p className="text-sm text-zinc-400">Loading...</p>}

        {!loading && progress.length === 0 && (
          <Card className="flex flex-col items-center gap-2 p-10 text-center">
            <MessageSquareText size={28} className="text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No reviews yet. Add one from the Daily Tasks tab by writing a note on an intern&apos;s task.
            </p>
          </Card>
        )}

        {!loading && progress.length > 0 && filtered.length === 0 && (
          <Card className="p-6 text-center text-sm text-zinc-400">
            No reviews match your filters.
          </Card>
        )}

        {filtered.map((p) => (
          <ReviewCard key={p._id} progress={p} onSave={handleSave} />
        ))}
      </Card>
    </div>
  );
}
