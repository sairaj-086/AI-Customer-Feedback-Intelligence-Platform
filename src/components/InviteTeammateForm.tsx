"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteTeammateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] ?? data.error ?? "Couldn't add teammate.");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    setRole("VIEWER");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="bg-white border rounded-xl p-5 space-y-3">
      <h2 className="font-semibold">Add a teammate</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          required
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Temporary password (min 8 chars)"
          type="password"
          required
          minLength={8}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="VIEWER">Viewer — read-only dashboard</option>
          <option value="MANAGER">Manager — analytics, Q&A, reports</option>
          <option value="ADMIN">Admin — full access + team management</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Adding…" : "Add teammate"}
      </button>
    </form>
  );
}
