"use client";

import { useState } from "react";

export default function AskLoop() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(res.ok ? data.answer : data.error ?? "Something went wrong.");
    } catch {
      setAnswer("Something went wrong reaching the AI service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border rounded-xl p-5">
      <h2 className="font-semibold mb-1">Ask LOOP</h2>
      <p className="text-sm text-gray-500 mb-3">
        Ask a question about your feedback in plain English — e.g. "What's frustrating customers most this month?"
      </p>
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Ask a question…"
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={ask}
          disabled={loading}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </div>
      {answer && (
        <div className="mt-4 text-sm bg-gray-50 border rounded-lg p-4 whitespace-pre-wrap">{answer}</div>
      )}
    </div>
  );
}
