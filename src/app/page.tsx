"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Users, ListChecks, CalendarCheck, AlertTriangle } from "lucide-react";
import Card from "@/components/Card";
import { apiFetch } from "@/lib/api-client";
import { DashboardStats } from "@/lib/types";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Layers;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-2.5 text-zinc-700 dark:text-zinc-300">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              icon={Layers}
              label="Batches"
              value={stats.totalBatches}
              hint={`${stats.activeBatches} active`}
            />
            <StatCard
              icon={Users}
              label="Interns"
              value={stats.totalInterns}
              hint={`${stats.activeInterns} active`}
            />
            <StatCard
              icon={ListChecks}
              label="Tasks"
              value={stats.pendingTasks + stats.inProgressTasks + stats.completedTasks}
              hint={`${stats.pendingTasks} pending, ${stats.inProgressTasks} in progress, ${stats.completedTasks} done`}
            />
            <StatCard
              icon={CalendarCheck}
              label="Attendance today"
              value={`${stats.attendanceRate}%`}
              hint={`${stats.presentToday} present of ${stats.activeInterns} active interns`}
            />
            <StatCard
              icon={AlertTriangle}
              label="Danger zone"
              value={stats.dangerZoneCount}
              hint="Interns below completion threshold this month"
            />
          </div>

          {stats.dangerZoneInterns.length > 0 && (
            <Card className="p-5">
              <h2 className="font-medium text-zinc-900 dark:text-zinc-50 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" /> Danger Zone Interns (this month)
              </h2>
              <div className="space-y-2">
                {stats.dangerZoneInterns.map((i) => (
                  <div key={i.internId} className="flex items-center justify-between text-sm">
                    <Link href={`/interns/${i.internId}`} className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline">
                      {i.internName}
                    </Link>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {i.batchName} &middot; {i.completionRate}% complete ({i.completedTasks}/{i.totalTasks})
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/reports" className="mt-3 inline-block text-sm text-zinc-600 dark:text-zinc-400 hover:underline">
                View full report &rarr;
              </Link>
            </Card>
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
