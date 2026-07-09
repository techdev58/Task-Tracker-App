"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api-client";
import { BatchDTO, InternDTO } from "@/lib/types";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  iconButtonClass,
} from "@/components/formStyles";

function batchName(intern: InternDTO) {
  return typeof intern.batch === "string" ? intern.batch : intern.batch?.name ?? "-";
}

function batchId(intern: InternDTO) {
  return typeof intern.batch === "string" ? intern.batch : intern.batch?._id ?? "";
}

function InternForm({
  batches,
  initial,
  onSaved,
  onClose,
}: {
  batches: BatchDTO[];
  initial?: InternDTO;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [batch, setBatch] = useState(initial ? batchId(initial) : batches[0]?._id ?? "");
  const [joinDate, setJoinDate] = useState(initial?.joinDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = { name, email, phone, batch, joinDate, status };
      if (initial) {
        await apiFetch(`/api/interns/${initial._id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiFetch("/api/interns", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save intern");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={initial ? "Edit Intern" : "New Intern"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div>
          <label className={labelClass}>Name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Batch</label>
          <select className={inputClass} value={batch} onChange={(e) => setBatch(e.target.value)} required>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Join Date</label>
            <input type="date" className={inputClass} value={joinDate} onChange={(e) => setJoinDate(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as InternDTO["status"])}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryButtonClass} disabled={saving || batches.length === 0}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function InternsPage() {
  const [interns, setInterns] = useState<InternDTO[]>([]);
  const [batches, setBatches] = useState<BatchDTO[]>([]);
  const [batchFilter, setBatchFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InternDTO | undefined>();

  async function load() {
    setLoading(true);
    try {
      const [internData, batchData] = await Promise.all([
        apiFetch<InternDTO[]>(`/api/interns${batchFilter ? `?batch=${batchFilter}` : ""}`),
        apiFetch<BatchDTO[]>("/api/batches"),
      ]);
      setInterns(internData);
      setBatches(batchData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchFilter]);

  async function handleDelete(intern: InternDTO) {
    if (!confirm(`Delete "${intern.name}"? This will also remove their tasks, attendance, reports, and reviews.`)) return;
    try {
      await apiFetch(`/api/interns/${intern._id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete intern");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Interns</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage interns across all batches.</p>
        </div>
        <button
          className={primaryButtonClass}
          onClick={() => { setEditing(undefined); setShowForm(true); }}
          disabled={batches.length === 0}
        >
          <Plus size={16} /> New Intern
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-zinc-500 dark:text-zinc-400">Filter by batch:</label>
        <select className={`${inputClass} w-full sm:w-64`} value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
          <option value="">All batches</option>
          {batches.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {batches.length === 0 && !loading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Create a batch first before adding interns.</p>
      )}

      <Card className="max-h-[65vh] overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-zinc-500 dark:text-zinc-400">
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Name</th>
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Email</th>
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Batch</th>
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Joined</th>
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Status</th>
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 text-right font-medium dark:border-zinc-800 dark:bg-zinc-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-400">Loading...</td></tr>
            )}
            {!loading && interns.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-400">No interns yet.</td></tr>
            )}
            {interns.map((intern) => (
              <tr key={intern._id} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/interns/${intern._id}`} className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline">
                    {intern.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{intern.email}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{batchName(intern)}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{intern.joinDate.slice(0, 10)}</td>
                <td className="px-4 py-3"><StatusBadge value={intern.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button className={iconButtonClass} onClick={() => { setEditing(intern); setShowForm(true); }} aria-label="Edit">
                      <Pencil size={16} />
                    </button>
                    <button className={iconButtonClass} onClick={() => handleDelete(intern)} aria-label="Delete">
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
        <InternForm
          batches={batches}
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}
