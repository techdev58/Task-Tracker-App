"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Users, ListChecks, CalendarCheck, AlertTriangle, UserX } from "lucide-react";
import Card from "@/components/Card";
import { apiFetch } from "@/lib/api-client";
import { DashboardStats } from "@/lib/types";

type Tone = "slate" | "violet" | "blue" | "emerald" | "amber" | "red";

const TONE_ICON: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
};

const TONE_VALUE: Record<Tone, string> = {
  slate: "text-zinc-900 dark:text-zinc-50",
  violet: "text-zinc-900 dark:text-zinc-50",
  blue: "text-zinc-900 dark:text-zinc-50",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
};

const TONE_BAR: Record<Tone, string> = {
  slate: "bg-slate-400",
  violet: "bg-violet-400",
  blue: "bg-blue-400",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "slate",
}: {
  icon: typeof Layers;
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <Card className="relative overflow-hidden p-5 transition-shadow hover:shadow-md hover:shadow-zinc-900/5">
      <span className={`absolute inset-x-0 top-0 h-1 ${TONE_BAR[tone]}`} />
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${TONE_ICON[tone]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className={`text-2xl font-semibold ${TONE_VALUE[tone]}`}>{value}</p>
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  async function loadStats() {
    try {
      const data = await apiFetch<DashboardStats>("/api/dashboard/stats");
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
  }, []);

  const attendanceTone: Tone = !stats
    ? "slate"
    : stats.attendanceRate >= 75
    ? "emerald"
    : stats.attendanceRate >= 40
    ? "amber"
    : "red";
  const dangerTone: Tone = stats && stats.dangerZoneCount > 0 ? "red" : "emerald";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Overview of batches, interns, tasks, and attendance.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {!stats ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard
              icon={Layers}
              label="Batches"
              value={stats.totalBatches}
              hint={`${stats.activeBatches} active`}
              tone="slate"
            />
            <StatCard
              icon={Users}
              label="Interns"
              value={stats.totalInterns}
              hint={`${stats.activeInterns} active`}
              tone="violet"
            />
            <StatCard
              icon={ListChecks}
              label="Tasks"
              value={stats.pendingTasks + stats.inProgressTasks + stats.completedTasks}
              hint={`${stats.pendingTasks} pending, ${stats.inProgressTasks} in progress, ${stats.completedTasks} done`}
              tone="blue"
            />
            <StatCard
              icon={CalendarCheck}
              label="Attendance today"
              value={`${stats.attendanceRate}%`}
              hint={`${stats.presentToday} present of ${stats.activeInterns} active interns`}
              tone={attendanceTone}
            />
            <StatCard
              icon={AlertTriangle}
              label="Danger zone"
              value={stats.dangerZoneCount}
              hint="Interns below completion threshold, overall"
              tone={dangerTone}
            />
          </div>

          {stats.absentToday.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950/30">
              <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
                <UserX size={15} /> Absent today ({stats.absentToday.length}):
              </span>
              {stats.absentToday.map((i) => (
                <Link
                  key={i.internId}
                  href={`/interns/${i.internId}`}
                  className="rounded-full bg-white px-2.5 py-0.5 text-sm text-zinc-700 hover:underline dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {i.internName}
                </Link>
              ))}
            </div>
          )}

          {stats.batchProgress.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Progress by Batch (since each batch started)</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {stats.batchProgress.map((b) => {
                  const barTone: Tone =
                    b.avgCompletionRate === null
                      ? "slate"
                      : b.avgCompletionRate >= 75
                      ? "emerald"
                      : b.avgCompletionRate >= 40
                      ? "amber"
                      : "red";
                  return (
                    <Card key={b.batchId} className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <Link href={`/batches/${b.batchId}`} className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline">
                          {b.batchName}
                        </Link>
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                          {b.avgCompletionRate === null ? "No tasks" : `${b.avgCompletionRate}% avg completion`}
                        </span>
                      </div>

                      {b.avgCompletionRate !== null && (
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className={`h-full rounded-full ${TONE_BAR[barTone]}`}
                            style={{ width: `${b.avgCompletionRate}%` }}
                          />
                        </div>
                      )}

                      <p className="mt-3 mb-3 text-xs text-zinc-400">{b.activeInterns} active interns</p>

                      {b.dangerZoneCount === 0 ? (
                        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                          No interns in the danger zone.
                        </div>
                      ) : (
                        <div className="space-y-2 rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                          <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                            <AlertTriangle size={12} /> {b.dangerZoneCount} in danger zone
                          </p>
                          {b.dangerZoneInterns.map((i) => (
                            <div key={i.internId} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-sm">
                              <Link href={`/interns/${i.internId}`} className="text-zinc-900 dark:text-zinc-50 hover:underline">
                                {i.internName}
                              </Link>
                              <span className="text-zinc-500 dark:text-zinc-400">
                                {i.completionRate}% ({i.completedTasks}/{i.totalTasks})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
              <Link href="/reports" className="inline-block text-sm text-zinc-600 dark:text-zinc-400 hover:underline">
                View full report &rarr;
              </Link>
            </div>
          )}

          {stats.totalBatches === 0 && (
            <Card className="p-6 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No data yet. Head to the <span className="font-medium">Batches</span> tab to create
                your first batch, then add interns and tasks.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
