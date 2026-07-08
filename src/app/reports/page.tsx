"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/Card";
import { apiFetch } from "@/lib/api-client";
import { BatchDTO, ProgressReportResponse } from "@/lib/types";
import { inputClass, labelClass } from "@/components/formStyles";

export default function ReportsPage() {
  const [period, setPeriod] = useState<"week" | "month">("month");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchFilter, setBatchFilter] = useState("");
  const [threshold, setThreshold] = useState(50);
  const [batches, setBatches] = useState<BatchDTO[]>([]);
  const [report, setReport] = useState<ProgressReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<BatchDTO[]>("/api/batches").then(setBatches).catch(() => setBatches([]));
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ period, date, threshold: String(threshold) });
      if (batchFilter) params.set("batch", batchFilter);
      const data = await apiFetch<ProgressReportResponse>(`/api/reports?${params.toString()}`);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, date, batchFilter, threshold]);

  const dangerCount = report?.interns.filter((i) => i.zone === "danger").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Reports</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Weekly or monthly task-completion progress per intern. Credit decays the longer a
          submission is late: on time = 100%, 1 day late = 50%, 2 days late = 33%, 3 days late =
          25%, and so on (1 / (days late + 1)).
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className={labelClass}>Period</label>
          <div className="flex gap-1">
            {(["week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-2 text-sm font-medium border capitalize ${
                  period === p
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-50"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>Reference date</label>
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Batch</label>
          <select className={`${inputClass} w-56`} value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
            <option value="">All batches</option>
            {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Danger threshold (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            className={`${inputClass} w-28`}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {report && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Showing {report.start.slice(0, 10)} to {report.end.slice(0, 10)}
          {dangerCount > 0 && (
            <span className="ml-2 font-medium text-red-600 dark:text-red-400">
              {dangerCount} intern{dangerCount > 1 ? "s" : ""} in danger zone
            </span>
          )}
        </p>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
              <th className="px-4 py-3 font-medium">Intern</th>
              <th className="px-4 py-3 font-medium">Batch</th>
              <th className="px-4 py-3 font-medium">Assigned</th>
              <th className="px-4 py-3 font-medium">On Time</th>
              <th className="px-4 py-3 font-medium">Late</th>
              <th className="px-4 py-3 font-medium">Completion Score</th>
              <th className="px-4 py-3 font-medium">Zone</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-zinc-400">Loading...</td></tr>}
            {!loading && report && report.interns.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-zinc-400">No active interns to report on.</td></tr>
            )}
            {report?.interns.map((i) => (
              <tr key={i.internId} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/interns/${i.internId}`} className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline">
                    {i.internName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{i.batchName}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{i.totalTasks}</td>
                <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{i.onTimeTasks}</td>
                <td className="px-4 py-3 text-red-600 dark:text-red-400">{i.lateTasks}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {i.completionRate === null ? "No tasks" : `${i.completionRate}%`}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      i.zone === "danger"
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    }`}
                  >
                    {i.zone === "danger" ? "Danger Zone" : "Safe"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
