"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api-client";
import { TaskDTO } from "@/lib/types";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  iconButtonClass,
} from "@/components/formStyles";

function TaskForm({
  initial,
  onSaved,
  onClose,
}: {
  initial?: TaskDTO;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? "medium");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = { title, description, priority };
      if (initial) {
        await apiFetch(`/api/tasks/${initial._id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiFetch("/api/tasks", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={initial ? "Edit Task" : "New Task"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div>
          <label className={labelClass}>Title</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea className={inputClass} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Priority</label>
          <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value as TaskDTO["priority"])}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryButtonClass} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TaskDTO | undefined>();

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<TaskDTO[]>("/api/tasks");
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleDelete(task: TaskDTO) {
    if (!confirm(`Delete "${task.title}"? This will also remove any batch assignments made from it.`)) return;
    try {
      await apiFetch(`/api/tasks/${task._id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete task");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Tasks</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Reusable task catalog. Assign these to a batch from the Daily Tasks tab.
          </p>
        </div>
        <button className={primaryButtonClass} onClick={() => { setEditing(undefined); setShowForm(true); }}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-4 py-6 text-center text-zinc-400">Loading...</td></tr>}
            {!loading && tasks.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-zinc-400">No tasks yet.</td></tr>}
            {tasks.map((task) => (
              <tr key={task._id} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{task.title}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{task.description || "-"}</td>
                <td className="px-4 py-3"><StatusBadge value={task.priority} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button className={iconButtonClass} onClick={() => { setEditing(task); setShowForm(true); }} aria-label="Edit">
                      <Pencil size={16} />
                    </button>
                    <button className={iconButtonClass} onClick={() => handleDelete(task)} aria-label="Delete">
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
        <TaskForm initial={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}
