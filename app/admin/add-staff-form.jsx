"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Copy, Check } from "lucide-react";

export default function AdminAddStaffForm({ properties }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const propertyId = form.get("propertyId");
    const name = form.get("name");
    const email = form.get("email");
    const password = form.get("password");

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add staff account.");

      setResult({ name, email, password });
      e.target.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function copyCredentials() {
    if (!result) return;
    navigator.clipboard.writeText(
      `Hotelynk login for ${result.name}\nEmail: ${result.email}\nPassword: ${result.password}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    return (
      <div className="mt-5 rounded-2xl border border-moss/25 bg-moss/10 p-5">
        <p className="font-body text-sm text-cream">
          <span className="font-semibold">{result.name}</span>'s staff account is ready:
        </p>
        <div className="mt-3 space-y-1 rounded-xl bg-dusk px-4 py-3 font-mono text-xs text-cream/80">
          <p>Email: {result.email}</p>
          <p>Password: {result.password}</p>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={copyCredentials}
            className="inline-flex items-center gap-1.5 rounded-full bg-cream px-4 py-2 font-body text-xs font-semibold text-dusk transition hover:bg-cream/90"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy credentials"}
          </button>
          <button
            onClick={() => setResult(null)}
            className="rounded-full border border-cream/15 px-4 py-2 font-body text-xs text-cream/70 transition hover:border-cream/30"
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <p className="mt-5 font-body text-sm text-cream/40">
        Add a client first before adding staff to them.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label className="font-body text-xs font-medium text-cream/60">Which client</label>
        <select
          name="propertyId"
          required
          className="mt-1 w-full rounded-xl border border-cream/15 bg-dusk px-3 py-2.5 font-body text-sm text-cream focus:border-coral"
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="font-body text-xs font-medium text-cream/60">Staff member's name</label>
        <input
          name="name"
          required
          placeholder="e.g. Vishal Gaonkar"
          className="mt-1 w-full rounded-xl border border-cream/15 bg-dusk px-3 py-2.5 font-body text-sm text-cream placeholder:text-cream/30 focus:border-coral"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="font-body text-xs font-medium text-cream/60">Their email (login)</label>
          <input
            name="email"
            type="email"
            required
            placeholder="staff@example.com"
            className="mt-1 w-full rounded-xl border border-cream/15 bg-dusk px-3 py-2.5 font-body text-sm text-cream placeholder:text-cream/30 focus:border-coral"
          />
        </div>
        <div>
          <label className="font-body text-xs font-medium text-cream/60">Temporary password</label>
          <input
            name="password"
            required
            minLength={6}
            placeholder="At least 6 characters"
            className="mt-1 w-full rounded-xl border border-cream/15 bg-dusk px-3 py-2.5 font-body text-sm text-cream placeholder:text-cream/30 focus:border-coral"
          />
        </div>
      </div>

      {error && <p className="font-body text-sm text-coral">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-full border border-cream/15 px-6 py-3 font-body text-sm font-semibold text-cream transition hover:border-cream/30 disabled:opacity-70"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Creating…" : "Add staff account"}
      </button>
    </form>
  );
}
