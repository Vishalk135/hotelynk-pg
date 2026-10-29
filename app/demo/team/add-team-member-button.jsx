"use client";

import { useState } from "react";
import { useRefresh } from "../use-refresh";
import { Plus, X, Loader2, Copy, Check } from "lucide-react";

export default function AddTeamMemberButton() {
  const [open, setOpen] = useState(false);
  const { refresh } = useRefresh();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get("name");
    const email = form.get("email");
    const password = form.get("password");

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add staff account.");
      setResult({ name, email, password });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
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

  function closeAndReset() {
    setOpen(false);
    setResult(null);
    setError("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 self-start rounded-full bg-dusk px-5 py-2.5 font-body text-sm font-semibold text-cream shadow-soft transition hover:bg-dusk/85"
      >
        <Plus className="h-4 w-4" />
        Add team member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-dusk-deep/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-cream p-6 shadow-lift sm:rounded-3xl sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-dusk">
                {result ? "Account created" : "Add a team member"}
              </h2>
              <button
                onClick={closeAndReset}
                aria-label="Close"
                className="rounded-lg p-1.5 text-dusk/50 transition hover:bg-dusk/5 hover:text-dusk"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {result ? (
              <div className="mt-5">
                <p className="font-body text-sm text-dusk/70">
                  Share these credentials with <span className="font-semibold">{result.name}</span>:
                </p>
                <div className="mt-3 space-y-1 rounded-xl bg-dusk px-4 py-3 font-mono text-xs text-cream/80">
                  <p>Email: {result.email}</p>
                  <p>Password: {result.password}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={copyCredentials}
                    className="inline-flex items-center gap-1.5 rounded-full bg-coral px-4 py-2 font-body text-xs font-semibold text-cream transition hover:bg-coral-dark"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy credentials"}
                  </button>
                  <button
                    onClick={closeAndReset}
                    className="rounded-full border border-dusk/15 px-4 py-2 font-body text-xs text-dusk/70 transition hover:border-dusk/30"
                  >
                    Done
                  </button>
                </div>
                <p className="mt-3 font-body text-xs text-dusk/40">
                  This account can see bookings, POS, and staff scheduling — but not revenue
                  figures.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="font-body text-xs font-medium text-dusk/60">Name</label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Vishal Gaonkar"
                    className="mt-1 w-full rounded-xl border border-dusk/15 bg-white px-3 py-2.5 font-body text-sm text-dusk placeholder:text-dusk/30 focus:border-coral"
                  />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-dusk/60">
                    Email (their login)
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="staff@example.com"
                    className="mt-1 w-full rounded-xl border border-dusk/15 bg-white px-3 py-2.5 font-body text-sm text-dusk placeholder:text-dusk/30 focus:border-coral"
                  />
                </div>
                <div>
                  <label className="font-body text-xs font-medium text-dusk/60">
                    Temporary password
                  </label>
                  <input
                    name="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className="mt-1 w-full rounded-xl border border-dusk/15 bg-white px-3 py-2.5 font-body text-sm text-dusk placeholder:text-dusk/30 focus:border-coral"
                  />
                </div>
                {error && <p className="font-body text-sm text-coral">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-dusk py-3 font-body text-sm font-semibold text-cream shadow-soft transition hover:bg-dusk/85 disabled:opacity-70"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Creating…" : "Create account"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
