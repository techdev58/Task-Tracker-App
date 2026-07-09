"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api-client";
import { BatchDTO, InternDTO } from "@/lib/types";

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<BatchDTO | null>(null);
  const [interns, setInterns] = useState<InternDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [batchData, internData] = await Promise.all([
          apiFetch<BatchDTO>(`/api/batches/${id}`),
          apiFetch<InternDTO[]>(`/api/interns?batch=${id}`),
        ]);
        setBatch(batchData);
        setInterns(internData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load batch");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>;
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!batch) return null;

  return (
    <div className="space-y-6">
      <Link href="/batches" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft size={16} /> Back to batches
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{batch.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{batch.description}</p>
        </div>
        <StatusBadge value={batch.status} />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Interns ({interns.length})</h2>
          <Link href="/interns" className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline">
            Manage interns &rarr;
          </Link>
        </div>
        <div className="max-h-[55vh] overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-zinc-500 dark:text-zinc-400">
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white py-2 font-medium dark:border-zinc-800 dark:bg-zinc-900">Name</th>
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white py-2 font-medium dark:border-zinc-800 dark:bg-zinc-900">Email</th>
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white py-2 font-medium dark:border-zinc-800 dark:bg-zinc-900">Joined</th>
              <th className="sticky top-0 z-10 border-b border-zinc-200 bg-white py-2 font-medium dark:border-zinc-800 dark:bg-zinc-900">Status</th>
            </tr>
          </thead>
          <tbody>
            {interns.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-zinc-400">No interns in this batch yet.</td></tr>
            )}
            {interns.map((intern) => (
              <tr key={intern._id} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                <td className="py-2">
                  <Link href={`/interns/${intern._id}`} className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline">
                    {intern.name}
                  </Link>
                </td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">{intern.email}</td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">{intern.joinDate.slice(0, 10)}</td>
                <td className="py-2"><StatusBadge value={intern.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}
