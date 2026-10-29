import Link from "next/link";
import { BedDouble, IndianRupee, TrendingDown, TrendingUp } from "lucide-react";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import AddRoomButton from "../bookings/add-room-button";
import RoomRowActions from "./room-row-actions";

const STATUS = {
  VACANT: { label: "Vacant", cls: "bg-moss/10 text-moss-dark" },
  CHECKED_IN: { label: "Checked in", cls: "bg-azure/10 text-azure" },
  ARRIVING: { label: "Arriving", cls: "bg-mustard/15 text-mustard-dark" },
  DEPARTING: { label: "Departing", cls: "bg-coral/10 text-coral-dark" },
  HOUSEKEEPING: { label: "Housekeeping", cls: "bg-dusk/10 text-dusk/60" },
};

const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// Everything on this page is read from the `rooms` table in PostgreSQL.
export default async function RatesPage() {
  const user = await getCurrentUser();
  const canEdit = user.role === "OWNER"; // only the owner changes rates

  const rooms = await query(
    `SELECT r.id, r.name, r.price, r.status,
            (SELECT COUNT(*)::int FROM bookings b WHERE b.room_id = r.id) AS "bookingCount"
       FROM rooms r WHERE r.property_id = $1 ORDER BY r.price DESC, r.name`,
    [user.propertyId]
  );

  const prices = rooms.map((r) => r.price);
  const total = prices.reduce((a, b) => a + b, 0);
  const stats = [
    { label: "Rooms", value: rooms.length, sub: "in your property", icon: BedDouble },
    { label: "Lowest rate", value: rooms.length ? rupees(Math.min(...prices)) : "—", sub: "per night", icon: TrendingDown },
    { label: "Highest rate", value: rooms.length ? rupees(Math.max(...prices)) : "—", sub: "per night", icon: TrendingUp },
    { label: "Full-house night", value: rooms.length ? rupees(total) : "—", sub: "if every room is booked", icon: IndianRupee },
  ];

  // Group rooms that share a price into one "rate" row
  const groups = new Map();
  for (const r of rooms) groups.set(r.price, [...(groups.get(r.price) ?? []), r.name]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-dusk/60">RATES</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-dusk sm:text-3xl">Room rates</h1>
          <p className="mt-2 font-body text-sm text-dusk/60">
            Saved in your database. {canEdit ? "Add a room or change a rate and it updates everywhere, including " : "Rates also appear on the "}
            <Link href="/demo/bookings" className="font-medium text-coral-dark hover:underline">
              Bookings
            </Link>
            .
          </p>
        </div>
        {canEdit && <AddRoomButton />}
      </div>

      {rooms.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dusk/10 bg-white/70 px-6 py-12 text-center shadow-soft">
          <p className="font-body text-sm text-dusk/60">No rooms yet. {canEdit ? "Use “Add room” above to create your first room and set its rate." : "The owner can add rooms and set their rates."}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl border border-dusk/10 bg-white/70 p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-dusk/50">{s.label}</span>
                    <Icon className="h-4 w-4 text-dusk/40" />
                  </div>
                  <p className="mt-3 font-display text-2xl font-bold text-dusk">{s.value}</p>
                  <p className="mt-1 font-body text-xs text-dusk/50">{s.sub}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-dusk/10 bg-white/70 shadow-soft">
            <div className="border-b border-dusk/10 px-6 py-4">
              <h2 className="font-display text-lg font-bold text-dusk">Rates at a glance</h2>
              <p className="mt-0.5 font-body text-xs text-dusk/50">Rooms with the same nightly rate are grouped together.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left">
                <thead>
                  <tr className="font-mono text-[11px] uppercase tracking-wide text-dusk/40">
                    <th className="px-6 py-3 font-medium">Nightly rate</th>
                    <th className="px-4 py-3 font-medium">Rooms</th>
                    <th className="px-4 py-3 font-medium">Which rooms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dusk/5">
                  {[...groups.entries()].map(([price, names]) => (
                    <tr key={price} className="font-body text-sm text-dusk">
                      <td className="px-6 py-4 font-semibold">{rupees(price)}</td>
                      <td className="px-4 py-4 text-dusk/70">{names.length}</td>
                      <td className="px-4 py-4 text-dusk/70">{names.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-dusk/10 bg-white/70 shadow-soft">
            <div className="border-b border-dusk/10 px-6 py-4">
              <h2 className="font-display text-lg font-bold text-dusk">All rooms</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left">
                <thead>
                  <tr className="font-mono text-[11px] uppercase tracking-wide text-dusk/40">
                    <th className="px-6 py-3 font-medium">Room</th>
                    <th className="px-4 py-3 font-medium">Rate / night</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    {canEdit && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dusk/5">
                  {rooms.map((r) => {
                    const st = STATUS[r.status] ?? STATUS.VACANT;
                    return (
                      <tr key={r.id} className="font-body text-sm text-dusk">
                        <td className="px-6 py-4 font-medium">{r.name}</td>
                        <td className="px-4 py-4">{rupees(r.price)}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${st.cls}`}>{st.label}</span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-2">
                            <RoomRowActions room={r} />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
