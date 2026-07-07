"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api-client";
import { BatchDTO } from "@/lib/types";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  iconButtonClass,
} from "@/components/formStyles";

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function BatchForm({
  initial,
  onSaved,
  onClose,
}: {
  initial?: BatchDTO;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startDate, setStartDate] = useState(toDateInput(initial?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(initial?.endDate));
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = { name, description, startDate, endDate: endDate || undefined, status };
      if (initial) {
        await apiFetch(`/api/batches/${initial._id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiFetch("/api/batches", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save batch");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={initial ? "Edit Batch" : "New Batch"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div>
          <label className={labelClass}>Name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Date</label>
            <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as BatchDTO["status"])}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
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

export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BatchDTO | undefined>();

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<BatchDTO[]>("/api/batches");
      setBatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load batches");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleDelete(batch: BatchDTO) {
    if (!confirm(`Delete "${batch.name}"? This will also remove its interns, tasks, attendance, reports, and reviews.`)) return;
    try {
      await apiFetch(`/api/batches/${batch._id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete batch");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Batches</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage internship batches.</p>
        </div>
        <button className={primaryButtonClass} onClick={() => { setEditing(undefined); setShowForm(true); }}>
          <Plus size={16} /> New Batch
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Interns</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">End</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-400">Loading...</td></tr>
            )}
            {!loading && batches.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-400">No batches yet.</td></tr>
            )}
            {batches.map((batch) => (
              <tr key={batch._id} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/batches/${batch._id}`} className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline">
                    {batch.name}
                  </Link>
                  {batch.description && <p className="text-xs text-zinc-400 mt-0.5">{batch.description}</p>}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{batch.internCount ?? 0}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{toDateInput(batch.startDate)}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{toDateInput(batch.endDate) || "-"}</td>
                <td className="px-4 py-3"><StatusBadge value={batch.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button className={iconButtonClass} onClick={() => { setEditing(batch); setShowForm(true); }} aria-label="Edit">
                      <Pencil size={16} />
                    </button>
                    <button className={iconButtonClass} onClick={() => handleDelete(batch)} aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showForm && (
        <BatchForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}
