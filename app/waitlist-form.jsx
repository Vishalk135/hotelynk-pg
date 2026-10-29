"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong.");
      }
      setStatus("submitted");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "submitted") {
    return (
      <div className="mt-8 rounded-2xl border border-moss/25 bg-moss/10 px-6 py-5 font-body text-sm text-moss">
        Got it. We'll reach out at <span className="font-semibold text-cream">{email}</span> before
        we come knocking.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourproperty.com"
          disabled={status === "loading"}
          className="w-full flex-1 rounded-full border border-cream/15 bg-dusk px-5 py-3 font-body text-sm text-cream placeholder:text-cream/30 focus:border-coral disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-3 font-body text-sm font-semibold text-cream shadow-soft transition hover:bg-coral-dark hover:shadow-glow disabled:opacity-70"
        >
          {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === "loading" ? "Sending…" : "Send"}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-3 text-center font-body text-sm text-coral">
          {errorMsg || "Couldn't send that — please try again."}
        </p>
      )}
    </div>
  );
}
