"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle2, Circle } from "lucide-react";
import Card from "@/components/Card";
import Select from "@/components/Select";
import { apiFetch } from "@/lib/api-client";
import { AttendanceDTO, AttendanceStatus, BatchDTO, InternDTO } from "@/lib/types";
import { inputClass, primaryButtonClass } from "@/components/formStyles";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "Leave" },
  { value: "half-day", label: "Half Day" },
];

interface Row {
  internId: string;
  name: string;
  email: string;
  status: AttendanceStatus;
  remarks: string;
  recorded: boolean;
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function AttendancePage() {
  const [batches, setBatches] = useState<BatchDTO[]>([]);
  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch<BatchDTO[]>("/api/batches").then((data) => {
      setBatches(data);
      if (data.length > 0) setBatchId(data[0]._id);
    }).catch((err) => setError(err instanceof Error ? err.message : "Failed to load batches"));
  }, []);

  useEffect(() => {
    if (!batchId) return;
    async function load() {
      setLoading(true);
      setMessage("");
      setError("");
      try {
        const [interns, attendance] = await Promise.all([
          apiFetch<InternDTO[]>(`/api/interns?batch=${batchId}&status=active`),
          apiFetch<AttendanceDTO[]>(`/api/attendance?batch=${batchId}&date=${date}`),
        ]);
        const attendanceByIntern = new Map(
          attendance.map((a) => [typeof a.intern === "string" ? a.intern : a.intern._id, a])
        );
        setRows(
          interns.map((i) => {
            const existing = attendanceByIntern.get(i._id);
            return {
              internId: i._id,
              name: i.name,
              email: i.email,
              status: existing?.status ?? "present",
              remarks: existing?.remarks ?? "",
              recorded: Boolean(existing),
            };
          })
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load attendance");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [batchId, date]);

  function updateRow(internId: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.internId === internId ? { ...r, ...patch } : r)));
  }

  const markedCount = rows.filter((r) => r.recorded).length;

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await apiFetch("/api/attendance", {
        method: "POST",
        body: JSON.stringify(
          rows.map((r) => ({ intern: r.internId, date, status: r.status, remarks: r.remarks }))
        ),
      });
      setRows((prev) => prev.map((r) => ({ ...r, recorded: true })));
      setMessage("Attendance saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Attendance</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Mark daily attendance for a batch.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select className="w-full sm:w-64" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
          {batches.length === 0 && <option value="">No batches</option>}
          {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </Select>
        <input type="date" className={`${inputClass} w-full sm:w-44`} value={date} onChange={(e) => setDate(e.target.value)} />
        <button className={primaryButtonClass} onClick={handleSave} disabled={saving || rows.length === 0}>
          <Save size={16} /> {saving ? "Saving..." : "Save Attendance"}
        </button>
        {!loading && rows.length > 0 && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              markedCount === rows.length
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                : markedCount > 0
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            <CheckCircle2 size={14} className="shrink-0" />
            {markedCount}/{rows.length} marked for {formatDate(date)}
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}

      <Card className="min-h-0 overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-zinc-500 dark:text-zinc-400">
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Intern</th>
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Status</th>
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Remarks</th>
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 font-medium dark:border-zinc-800 dark:bg-zinc-900">Recorded</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-4 py-6 text-center text-zinc-400">Loading...</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-zinc-400">No active interns in this batch.</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row.internId} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{row.name}</p>
                  <p className="text-xs text-zinc-400">{row.email}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateRow(row.internId, { status: opt.value })}
                        className={`rounded-md px-2 py-1 text-xs font-medium border ${
                          row.status === opt.value
                            ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-50"
                            : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    className={inputClass}
                    value={row.remarks}
                    onChange={(e) => updateRow(row.internId, { remarks: e.target.value })}
                    placeholder="Optional"
                  />
                </td>
                <td className="px-4 py-3">
                  {row.recorded ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} className="shrink-0" /> Marked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                      <Circle size={14} className="shrink-0" /> Not marked
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
