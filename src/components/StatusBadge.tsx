const COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  dropped: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "in-progress": "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
  present: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  absent: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  leave: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "half-day": "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  low: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  "on-time": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  late: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const LABELS: Record<string, string> = {
  "on-time": "On Time",
  late: "Late",
  "in-progress": "In Progress",
  "half-day": "Half Day",
};

export default function StatusBadge({ value }: { value: string }) {
  const classes = COLORS[value] ?? "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${classes}`}>
      {LABELS[value] ?? value}
    </span>
  );
}
