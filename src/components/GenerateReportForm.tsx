"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function isoDateDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function GenerateReportForm({ canGenerate }: { canGenerate: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("Monthly Voice-of-Customer Report");
  const [periodStart, setPeriodStart] = useState(isoDateDaysAgo(30));
  const [periodEnd, setPeriodEnd] = useState(isoDateDaysAgo(0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canGenerate) {
    return (
      <div className="bg-white border rounded-xl p-5 text-sm text-gray-500">
        Report generation requires the Manager or Admin role. Ask a teammate with access to generate one, or
        browse reports already generated for your workspace below.
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/voc-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd + "T23:59:59").toISOString(),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] ?? data.error ?? "Couldn't generate the report.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="bg-white border rounded-xl p-5 space-y-3">
      <h2 className="font-semibold">Generate a new report</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Report title"
        className="w-full border rounded-lg px-3 py-2 text-sm"
      />
      <div className="flex gap-3">
        <label className="flex-1 text-sm text-gray-600">
          From
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
          />
        </label>
        <label className="flex-1 text-sm text-gray-600">
          To
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Generating with AI…" : "Generate report"}
      </button>
    </form>
  );
}
