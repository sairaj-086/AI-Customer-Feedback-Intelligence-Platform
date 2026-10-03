"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const channels = ["EMAIL", "SURVEY", "APP_REVIEW", "SUPPORT_TICKET", "SOCIAL", "OTHER"];

export default function FeedbackForm() {
  const router = useRouter();
  const [channel, setChannel] = useState("SURVEY");
  const [customerName, setCustomerName] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, customerName: customerName || undefined, rawText }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Couldn't submit feedback — try again.");
      return;
    }
    setRawText("");
    setCustomerName("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="bg-white border rounded-xl p-5 space-y-3">
      <h2 className="font-semibold">Add feedback</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {channels.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ")}
            </option>
          ))}
        </select>
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer name (optional)"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <textarea
        required
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Paste the raw feedback text…"
        rows={3}
        className="w-full border rounded-lg px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Classifying with AI…" : "Submit & classify"}
      </button>
    </form>
  );
}
