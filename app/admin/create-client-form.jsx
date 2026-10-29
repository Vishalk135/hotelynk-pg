"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Copy, Check } from "lucide-react";

export default function CreateClientForm() {
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
    const propertyName = form.get("propertyName");
    const ownerName = form.get("ownerName");
    const ownerEmail = form.get("ownerEmail");
    const ownerPassword = form.get("ownerPassword");

    try {
      const res = await fetch("/api/admin/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyName, ownerName, ownerEmail, ownerPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create client.");

      setResult({ email: ownerEmail, password: ownerPassword, propertyName });
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
      `Hotelynk login for ${result.propertyName}\nEmail: ${result.email}\nPassword: ${result.password}\nSign in at: ${window.location.origin}/login`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    return (
      <div className="mt-5 rounded-2xl border border-moss/25 bg-moss/10 p-5">
        <p className="font-body text-sm text-cream">
          <span className="font-semibold">{result.propertyName}</span> is set up. Share these
          credentials with the client:
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
            Add another client
          </button>
        </div>
        <p className="mt-3 font-body text-xs text-cream/40">
          Tell them to change their password after first login — there's no self-serve "change
          password" screen yet, so for now that means you re-running this with a new password if
          they ever need a reset.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label className="font-body text-xs font-medium text-cream/60">
          Property / business name
        </label>
        <input
          name="propertyName"
          required
          placeholder="e.g. Candolim Villas"
          className="mt-1 w-full rounded-xl border border-cream/15 bg-dusk px-3 py-2.5 font-body text-sm text-cream placeholder:text-cream/30 focus:border-coral"
        />
      </div>
      <div>
        <label className="font-body text-xs font-medium text-cream/60">Owner's name</label>
        <input
          name="ownerName"
          required
          placeholder="e.g. Rohan D'Souza"
          className="mt-1 w-full rounded-xl border border-cream/15 bg-dusk px-3 py-2.5 font-body text-sm text-cream placeholder:text-cream/30 focus:border-coral"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="font-body text-xs font-medium text-cream/60">
            Owner's email (their login)
          </label>
          <input
            name="ownerEmail"
            type="email"
            required
            placeholder="owner@theirproperty.com"
            className="mt-1 w-full rounded-xl border border-cream/15 bg-dusk px-3 py-2.5 font-body text-sm text-cream placeholder:text-cream/30 focus:border-coral"
          />
        </div>
        <div>
          <label className="font-body text-xs font-medium text-cream/60">Temporary password</label>
          <input
            name="ownerPassword"
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
        className="flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-3 font-body text-sm font-semibold text-cream shadow-soft transition hover:bg-coral-dark disabled:opacity-70"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Creating…" : "Create client"}
      </button>
    </form>
  );
}
