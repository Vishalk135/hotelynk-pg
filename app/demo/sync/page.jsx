"use client";

import { useState } from "react";
import { RefreshCw, Check, Info } from "lucide-react";
import { channels, rateTable } from "../mock-data";

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  function handleSync() {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2500);
    }, 1200);
  }

  return (
    <div>
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-mustard/25 bg-mustard/10 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-mustard-dark" />
        <p className="font-body text-sm text-dusk/70">
          <span className="font-semibold text-dusk">Preview mode.</span> Bookings, POS and staff are
          now live on the real database — this channel manager screen is still a mockup, since real
          Airbnb/Booking.com/ MakeMyTrip sync requires applying and getting approved as a
          connectivity partner with each platform first.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-azure">SYNC</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-dusk sm:text-3xl">
            Channel manager
          </h1>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 self-start rounded-full bg-azure px-5 py-2.5 font-body text-sm font-semibold text-cream shadow-soft transition hover:bg-azure-dark hover:shadow-card disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : justSynced ? "Synced" : "Sync now"}
        </button>
      </div>

      {/* Connected channels */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {channels.map((c) => (
          <div
            key={c.name}
            className="rounded-2xl border border-dusk/10 bg-white/70 p-5 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-dusk">{c.name}</h3>
              <span
                className="flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: c.color }}
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-moss">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span className="font-body text-sm">{c.status}</span>
            </div>
            <p className="mt-3 font-mono text-[11px] text-dusk/40">
              {c.listings} listings · synced {justSynced ? "just now" : c.lastSync}
            </p>
          </div>
        ))}
      </div>

      {/* Rate parity table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-dusk/10 bg-white/70 shadow-soft">
        <div className="border-b border-dusk/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-dusk">Rate parity</h2>
          <p className="mt-0.5 font-body text-xs text-dusk/50">
            Change the base rate once — it pushes to every channel.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="font-mono text-[11px] uppercase tracking-wide text-dusk/40">
                <th className="px-6 py-3 font-medium">Room type</th>
                <th className="px-4 py-3 font-medium">Base rate</th>
                <th className="px-4 py-3 font-medium">Airbnb</th>
                <th className="px-4 py-3 font-medium">Booking.com</th>
                <th className="px-4 py-3 font-medium">MakeMyTrip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dusk/5">
              {rateTable.map((r) => (
                <tr key={r.room} className="font-body text-sm text-dusk">
                  <td className="px-6 py-4 font-medium">{r.room}</td>
                  <td className="px-4 py-4">₹{r.base.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-4 text-dusk/70">₹{r.airbnb.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-4 text-dusk/70">₹{r.booking.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-4 text-dusk/70">₹{r.mmt.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
